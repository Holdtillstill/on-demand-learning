resource "aws_elasticache_subnet_group" "main" {
  name       = "zhongwen-${var.environment}"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "redis" {
  name        = "zhongwen-${var.environment}-redis"
  description = "Allow Redis from private subnets"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = aws_subnet.private[*].cidr_block
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "zhongwen-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  # Demo placeholder. Production should use replication groups, encryption, auth tokens, and maintenance windows.
}
