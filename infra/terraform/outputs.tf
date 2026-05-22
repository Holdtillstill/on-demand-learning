output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "ecr_repository_urls" {
  value = { for name, repo in aws_ecr_repository.services : name => repo.repository_url }
}

output "media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
