provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "platform-academy"
      ManagedBy   = "terraform"
      Environment = var.environment
      CostCenter  = "portfolio-demo"
    }
  }
}
