"""Small dependency-free YAML subset parser for repository contract checks.

It intentionally supports only the YAML shapes used by this repository's
Compose and Kubernetes manifests: mappings, lists, quoted scalars, plain
scalars, empty maps/lists, and simple inline lists.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any


class YamlContractError(ValueError):
    pass


BLOCK_SCALAR_MARKERS = {"|", "|-", "|+", ">", ">-", ">+"}


def line_indent(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def clean_lines(text: str) -> list[str]:
    lines: list[str] = []
    for raw_line in text.splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        lines.append(raw_line.rstrip())
    return lines


def parse_scalar(value: str) -> Any:
    value = value.strip()
    if value in {"{}", "[]"}:
        return {} if value == "{}" else []
    if value.startswith("[") and value.endswith("]"):
        try:
            return ast.literal_eval(value)
        except (SyntaxError, ValueError):
            inner = value[1:-1].strip()
            if not inner:
                return []
            return [parse_scalar(item.strip()) for item in inner.split(",") if item.strip()]
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    if value in {"true", "false"}:
        return value == "true"
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    return value


def is_block_scalar(value: str) -> bool:
    return value.strip() in BLOCK_SCALAR_MARKERS


def parse_block_scalar(lines: list[str], index: int, parent_indent: int) -> tuple[str, int]:
    block_lines: list[str] = []
    block_indent: int | None = None
    while index < len(lines):
        line = lines[index]
        current_indent = line_indent(line)
        if current_indent <= parent_indent:
            break
        if block_indent is None:
            block_indent = current_indent
        strip_width = min(block_indent, len(line))
        block_lines.append(line[strip_width:])
        index += 1
    return "\n".join(block_lines), index


def split_key_value(text: str) -> tuple[str, str | None]:
    match = re.match(r"^([^:]+):(?:\s+(.*)|\s*)$", text)
    if not match:
        raise YamlContractError(f"expected YAML key/value line, got {text!r}")
    key = match.group(1).strip()
    value = match.group(2)
    return key, value.strip() if value is not None and value.strip() else None


def looks_like_key_value(text: str) -> bool:
    return re.match(r"^([^:]+):(?:\s+.*|\s*)$", text) is not None


def parse_mapping(lines: list[str], index: int, indent: int) -> tuple[dict[str, Any], int]:
    result: dict[str, Any] = {}
    while index < len(lines):
        line = lines[index]
        current_indent = line_indent(line)
        if current_indent < indent:
            break
        if current_indent > indent:
            raise YamlContractError(f"unexpected nested line at indent {current_indent}: {line!r}")
        stripped = line.strip()
        if stripped.startswith("- "):
            break
        key, value = split_key_value(stripped)
        index += 1
        if value is None:
            if index < len(lines) and line_indent(lines[index]) > indent:
                child, index = parse_node(lines, index, line_indent(lines[index]))
                result[key] = child
            else:
                result[key] = {}
        elif is_block_scalar(value):
            result[key], index = parse_block_scalar(lines, index, indent)
        else:
            result[key] = parse_scalar(value)
    return result, index


def parse_list(lines: list[str], index: int, indent: int) -> tuple[list[Any], int]:
    result: list[Any] = []
    while index < len(lines):
        line = lines[index]
        current_indent = line_indent(line)
        if current_indent < indent:
            break
        if current_indent > indent:
            raise YamlContractError(f"unexpected nested list line at indent {current_indent}: {line!r}")
        stripped = line.strip()
        if not stripped.startswith("- "):
            break
        item_text = stripped[2:].strip()
        index += 1
        if not item_text:
            if index < len(lines) and line_indent(lines[index]) > indent:
                item, index = parse_node(lines, index, line_indent(lines[index]))
            else:
                item = None
        elif looks_like_key_value(item_text):
            key, value = split_key_value(item_text)
            item = {key: parse_scalar(value) if value is not None and not is_block_scalar(value) else {}}
            if value is not None and is_block_scalar(value):
                item[key], index = parse_block_scalar(lines, index, indent)
            elif value is None and index < len(lines) and line_indent(lines[index]) > indent:
                child, index = parse_node(lines, index, line_indent(lines[index]))
                item[key] = child
            if index < len(lines) and line_indent(lines[index]) > indent:
                child, index = parse_mapping(lines, index, line_indent(lines[index]))
                item.update(child)
        else:
            item = parse_scalar(item_text)
            if index < len(lines) and line_indent(lines[index]) > indent:
                raise YamlContractError(f"scalar list item has unexpected nested content: {line!r}")
        result.append(item)
    return result, index


def parse_node(lines: list[str], index: int, indent: int) -> tuple[Any, int]:
    if index >= len(lines):
        return {}, index
    stripped = lines[index].strip()
    if stripped.startswith("- "):
        return parse_list(lines, index, indent)
    return parse_mapping(lines, index, indent)


def load_yaml_documents(path: Path) -> list[dict[str, Any]]:
    docs: list[dict[str, Any]] = []
    for raw_document in re.split(r"(?m)^---\s*$", path.read_text(encoding="utf-8")):
        lines = clean_lines(raw_document)
        if not lines:
            continue
        document, index = parse_node(lines, 0, line_indent(lines[0]))
        if index != len(lines):
            raise YamlContractError(f"could not parse complete YAML document starting with {lines[0]!r}")
        if not isinstance(document, dict):
            raise YamlContractError(f"YAML document must be a mapping, got {type(document).__name__}")
        docs.append(document)
    return docs


def load_single_yaml_document(path: Path) -> dict[str, Any]:
    docs = load_yaml_documents(path)
    if len(docs) != 1:
        raise YamlContractError(f"expected exactly one YAML document in {path}, got {len(docs)}")
    return docs[0]
