#!/usr/bin/env bash
# Builds one installable copy of the module per Odoo version from src/ (written for 18 and later).
# Odoo 17 differs in two places only: list views are <tree>, and a cron needs numbercall=-1 to run more than once.
# Odoo 20 replaced ir.model.access with ir.access: same rights, new file format.
set -euo pipefail
cd "$(dirname "$0")"
for v in 17.0 18.0 19.0 20.0; do
  rm -rf "$v"
  mkdir -p "$v"
  cp -r src/lahza_onboarding "$v/"
  find "$v" -name __pycache__ -prune -exec rm -rf {} +
  if [ "$v" = "17.0" ]; then
    sed -i 's/<list /<tree /; s#</list>#</tree>#; s#<field name="view_mode">list</field>#<field name="view_mode">tree</field>#' "$v/lahza_onboarding/views/lahza_moment_views.xml"
    sed -i 's#<field name="interval_type">days</field>#&\n        <field name="numbercall">-1</field>#' "$v/lahza_onboarding/data/ir_cron_data.xml"
  fi
  if [ "$v" = "20.0" ]; then
    rm "$v/lahza_onboarding/security/ir.model.access.csv"
    cat > "$v/lahza_onboarding/security/ir.access.csv" <<'CSV'
id,name,model_id,group_id/id,operation,domain
access_lahza_moment_user,lahza.moment user,lahza.moment,base.group_user,r,
access_lahza_moment_manager,lahza.moment manager,lahza.moment,hr.group_hr_manager,crud,
CSV
    sed -i 's#security/ir.model.access.csv#security/ir.access.csv#' "$v/lahza_onboarding/__manifest__.py"
  fi
done
echo "built 17.0 18.0 19.0 20.0"
