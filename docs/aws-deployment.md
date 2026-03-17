# AWS Deployment Guide

## Architecture Components

### 1. Frontend (AWS Amplify)
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
cd frontend
amplify init

# Add hosting
amplify add hosting
amplify publish
```

### 2. Backend (EC2 with Auto Scaling)

#### EC2 Setup
- Instance Type: t3.medium (2 vCPU, 4GB RAM)
- AMI: Amazon Linux 2
- Security Group: Allow ports 80, 443, 3001

#### User Data Script
```bash
#!/bin/bash
yum update -y
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git

# Clone repository
cd /home/ec2-user
git clone <your-repo-url>
cd studentlife-ai/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with production values

# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name studentlife-backend
pm2 startup
pm2 save
```

### 3. Database (RDS PostgreSQL)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier studentlife-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --multi-az
```

### 4. Cache (ElastiCache Redis)

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id studentlife-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx
```

### 5. Storage (S3)

```bash
# Create S3 bucket
aws s3 mb s3://studentlife-resources

# Enable CORS
aws s3api put-bucket-cors \
  --bucket studentlife-resources \
  --cors-configuration file://cors.json
```

cors.json:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourdomain.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 6. Authentication (Cognito)

```bash
# Create User Pool
aws cognito-idp create-user-pool \
  --pool-name studentlife-users \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true}" \
  --auto-verified-attributes email

# Create User Pool Client
aws cognito-idp create-user-pool-client \
  --user-pool-id <pool-id> \
  --client-name studentlife-client \
  --generate-secret
```

### 7. Load Balancer (ALB)

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name studentlife-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create Target Group
aws elbv2 create-target-group \
  --name studentlife-targets \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxx \
  --health-check-path /api/health

# Create Listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### 8. Auto Scaling

```bash
# Create Launch Template
aws ec2 create-launch-template \
  --launch-template-name studentlife-template \
  --version-description v1 \
  --launch-template-data file://launch-template.json

# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name studentlife-asg \
  --launch-template LaunchTemplateName=studentlife-template \
  --min-size 2 \
  --max-size 6 \
  --desired-capacity 2 \
  --target-group-arns <target-group-arn> \
  --vpc-zone-identifier "subnet-xxxxx,subnet-yyyyy"

# Create Scaling Policies
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name studentlife-asg \
  --policy-name scale-up \
  --scaling-adjustment 1 \
  --adjustment-type ChangeInCapacity
```

## Environment Variables (Production)

```bash
# Backend .env
DATABASE_URL=postgresql://admin:password@studentlife-db.xxxxx.rds.amazonaws.com:5432/studentlife
REDIS_URL=redis://studentlife-redis.xxxxx.cache.amazonaws.com:6379
JWT_SECRET=<strong-random-secret>
AWS_REGION=us-east-1
S3_BUCKET_NAME=studentlife-resources
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## Monitoring (CloudWatch)

```bash
# Create CloudWatch Dashboard
aws cloudwatch put-dashboard \
  --dashboard-name StudentLife \
  --dashboard-body file://dashboard.json

# Create Alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## CI/CD Pipeline (CodePipeline)

```yaml
# buildspec.yml
version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - cd backend
      - npm install
  build:
    commands:
      - npm run build
  post_build:
    commands:
      - echo Build completed
artifacts:
  files:
    - '**/*'
  base-directory: backend/dist
```

## Security Checklist

- [ ] Enable RDS encryption at rest
- [ ] Enable S3 bucket encryption
- [ ] Configure VPC with private subnets
- [ ] Setup Security Groups with minimal access
- [ ] Enable CloudTrail for audit logging
- [ ] Configure WAF rules on ALB
- [ ] Setup SSL/TLS certificates
- [ ] Enable MFA for AWS console access
- [ ] Rotate secrets regularly
- [ ] Enable GuardDuty for threat detection

## Cost Estimation (Monthly)

- EC2 (2x t3.medium): ~$60
- RDS (db.t3.micro): ~$15
- ElastiCache (cache.t3.micro): ~$12
- S3 Storage (100GB): ~$2.30
- Data Transfer: ~$10
- ALB: ~$20
- Cognito (10k MAU): Free
- CloudWatch: ~$5

**Total: ~$124/month**
