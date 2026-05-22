variable "aws_region" {
  description = "AWS region for the scaffold."
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "demo"
}

variable "alert_email" {
  description = "Email address for AWS Budget alerts. Replace before apply."
  type        = string
  default     = "replace-me@example.com"
}

variable "monthly_budget_limit_usd" {
  description = "Hard portfolio cost awareness guardrail."
  type        = string
  default     = "25"
}

variable "db_username" {
  description = "RDS username placeholder. Use Secrets Manager in production."
  type        = string
  default     = "zhongwen"
}

variable "db_password" {
  description = "RDS password placeholder. Never commit real values."
  type        = string
  default     = "REPLACE_ME_DO_NOT_APPLY"
  sensitive   = true
}
