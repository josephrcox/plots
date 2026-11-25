import { options } from "./harness";
const nz = (o: any, base = 0) => Object.entries(o).filter(([, v]) => v !== base && v !== 0).map(([k, v]) => `${k}${v}`).join(",");
for (const o of options) console.log([o.id.padEnd(16), "g" + o.requirements.gold, "emp" + o.requirements.employees, "req[" + nz(o.requirements.resources) + "]", "rev" + o.revenue_per_week, "gen[" + nz(o.generated_resources) + "]", "cost[" + nz(o.active_costs) + "]", "buy×[" + nz(o.purchase_effect_modifiers, 1) + "]", "wk×[" + nz(o.weekly_effect_modifiers, 1) + "]", "now[" + nz(o.immediate_variable_changes) + "]"].join(" "));
