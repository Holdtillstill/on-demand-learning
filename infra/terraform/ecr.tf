resource "aws_ecr_repository" "services" {
  for_each = toset(["api", "web", "worker"])

  name                 = "platform-academy/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
