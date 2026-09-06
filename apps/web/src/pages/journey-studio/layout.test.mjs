import assert from "node:assert/strict";

function waitEdgeLabel(businessDayOffset, delayHours) {
  const day = Number(businessDayOffset) || 0;
  const hours = Number(delayHours) || 0;
  if (day <= 0 && hours <= 0) return "mismo día hábil";
  if (day > 0 && hours > 0) return `día hábil ${day} · +${hours} h`;
  if (day > 0) return `día hábil ${day}`;
  return `+${hours} h`;
}

function layoutLinear(steps) {
  const nodes = [{ id: "trigger" }, ...steps.map((_, i) => ({ id: `step-${i}` })), { id: "goal" }];
  const edges = [];
  for (let i = 0; i < steps.length; i += 1) {
    edges.push({
      source: i === 0 ? "trigger" : `step-${i - 1}`,
      target: `step-${i}`,
      label: waitEdgeLabel(steps[i].businessDayOffset, steps[i].delayHours),
    });
  }
  edges.push({ source: steps.length ? `step-${steps.length - 1}` : "trigger", target: "goal" });
  return { nodes, edges };
}

assert.equal(waitEdgeLabel(0, 0), "mismo día hábil");
assert.equal(waitEdgeLabel(3, 2), "día hábil 3 · +2 h");
assert.equal(layoutLinear([]).nodes.length, 2);
assert.equal(layoutLinear([{ businessDayOffset: 1, delayHours: 0 }]).edges[0].label, "día hábil 1");
console.log("layoutLinear ok");
