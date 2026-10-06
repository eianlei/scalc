/**
 * Fill cost (bug-compatible: callers still parseInt euro prices).
 */
export function calculateCost(
  liters,
  fill_bar,
  add_o2,
  add_he,
  o2_cost_eur,
  he_cost_eur,
  fill_cost_eur,
) {
  let o2_lit = liters * fill_bar * (add_o2 / fill_bar)
  let he_lit = liters * fill_bar * (add_he / fill_bar)
  let o2_eur = (o2_lit * o2_cost_eur) / 1000
  let he_eur = (he_lit * he_cost_eur) / 1000
  let total_cost = fill_cost_eur + o2_eur + he_eur
  let txt =
    'Total cost of the fill is:\n' +
    `${total_cost.toFixed(2)} EUR\n` +
    `- ${o2_lit.toFixed(0)} liters Oxygen costing ${o2_eur.toFixed(2)} EUR\n` +
    `- ${he_lit.toFixed(0)} liters Helium costing ${he_eur.toFixed(2)} EUR\n` +
    `- cfm/air fill costing ${fill_cost_eur.toFixed(2)} EUR\n`

  return [total_cost, txt]
}
