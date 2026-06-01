# Network Path Evidence

Client check:
  curl -I https://checkout.example.com/healthz
  HTTP/2 503
  server: awselb/2.0

DNS:
  checkout.example.com -> k8s-payments-checkout-123456.us-west-2.elb.amazonaws.com

ALB target health:
  target 10.42.21.44:8080 unhealthy reason=Target.ResponseCodeMismatch Health checks failed with code 404
  target 10.42.31.52:8080 healthy

Ingress:
  host checkout.example.com
  path /healthz
  backend service checkout port http

Service:
  selector app=checkout
  port http: 80 -> targetPort web

Pods:
  checkout-7cf app=checkout ports=http:8080 readiness=/ready

Hypothesis:
  Traffic reaches the ALB and Ingress, but the Service targetPort name does not match the Pod port name.
