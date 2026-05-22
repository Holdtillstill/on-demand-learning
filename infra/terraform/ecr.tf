resource "aws_ecr_repository" "services" {
  for_each = toset(["api", "frontend", "worker"])

  name                 = "zhongwen/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
