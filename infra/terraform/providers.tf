provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "zhongwen-cloud-learning-platform"
      ManagedBy   = "terraform"
      Environment = var.environment
      CostCenter  = "portfolio-demo"
    }
  }
}
