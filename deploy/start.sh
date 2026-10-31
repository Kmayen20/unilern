#!/usr/bin/env bash
# Enciende RDS y EC2 y apunta CloudFront al nuevo DNS público de EC2 (cambia en cada encendido).
# Ejecutar desde la Mac: bash deploy/start.sh
set -euo pipefail
source "$(dirname "$0")/aws.env"
R=(--region "$AWS_REGION")

aws rds start-db-instance "${R[@]}" --db-instance-identifier "$RDS_INSTANCE_ID" >/dev/null 2>&1 || true
aws ec2 start-instances "${R[@]}" --instance-ids "$EC2_INSTANCE_ID" >/dev/null
echo "Esperando a que EC2 esté en ejecución…"
aws ec2 wait instance-running "${R[@]}" --instance-ids "$EC2_INSTANCE_ID"
DNS=$(aws ec2 describe-instances "${R[@]}" --instance-ids "$EC2_INSTANCE_ID" --query 'Reservations[0].Instances[0].PublicDnsName' --output text)
echo "DNS público de EC2: $DNS"

TMP=$(mktemp -d)
aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" > "$TMP/dist.json"
ETAG=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["ETag"])' "$TMP/dist.json")
CURRENT=$(python3 - "$TMP/dist.json" "$DNS" "$TMP/config.json" <<'PY'
import json, sys
d = json.load(open(sys.argv[1]))["DistributionConfig"]
origin = d["Origins"]["Items"][0]
print(origin["DomainName"])
origin["DomainName"] = sys.argv[2]
json.dump(d, open(sys.argv[3], "w"))
PY
)
if [[ "$CURRENT" == "$DNS" ]]; then
  echo "CloudFront ya apunta a $DNS."
else
  aws cloudfront update-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --if-match "$ETAG" --distribution-config "file://$TMP/config.json" >/dev/null
  echo "CloudFront actualizado ($CURRENT → $DNS). Tarda unos minutos en propagarse."
fi
rm -rf "$TMP"
echo "RDS puede tardar ~5 minutos más en estar disponible."
