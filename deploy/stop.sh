#!/usr/bin/env bash
# Apaga EC2 y RDS para no consumir horas de la capa gratuita. Ejecutar desde la Mac: bash deploy/stop.sh
# Ojo: RDS detenido se vuelve a encender solo a los 7 días.
set -euo pipefail
source "$(dirname "$0")/aws.env"
aws ec2 stop-instances --region "$AWS_REGION" --instance-ids "$EC2_INSTANCE_ID" --query 'StoppingInstances[0].CurrentState.Name' --output text
aws rds stop-db-instance --region "$AWS_REGION" --db-instance-identifier "$RDS_INSTANCE_ID" --query 'DBInstance.DBInstanceStatus' --output text
echo "Apagando EC2 y RDS."
