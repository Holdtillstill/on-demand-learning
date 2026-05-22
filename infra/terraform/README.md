# Terraform Scaffold

This directory is a reviewable AWS `us-west-2` scaffold for the Zhongwen Cloud Learning Platform. It is intentionally not wired into any automatic apply flow.

Before any real use:
- Review every variable and resource with a cost/security lens.
- Configure a remote state backend with locking.
- Replace placeholder CIDRs, retention values, and database sizing with environment-specific choices.
- Keep the AWS Budget alert enabled and start with a sandbox account.

Safe inspection commands:

```bash
terraform fmt -check
terraform init -backend=false
terraform validate
```

Do not run `terraform apply` from CI without explicit environment approval.
