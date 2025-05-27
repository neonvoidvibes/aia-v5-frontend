// Mock data for keywords that float on the canvas
export const mockKeywords = [
  {
    id: "keyword1",
    text: "What shared understanding do we have?",
    position: { x: 0.55, y: 0.25 },
    tag: "Mirror",
    secondaryTag: "Question",
  },
  {
    id: "keyword2",
    text: "Collective decision-making patterns",
    position: { x: 0.2, y: 0.35 },
    tag: "Lens",
  },
  {
    id: "keyword3",
    text: "Emerging group dynamics",
    position: { x: 0.25, y: 0.7 },
    tag: "Portal",
  },
  {
    id: "keyword4",
    text: "Hidden consensus opportunities",
    position: { x: 0.55, y: 0.55 },
    tag: "Lens",
  },
  {
    id: "keyword5",
    text: "Shared mental models",
    position: { x: 0.45, y: 0.8 },
    tag: "Mirror",
  },
  {
    id: "keyword6",
    text: "What possibilities are we not seeing?",
    position: { x: 0.8, y: 0.25 },
    tag: "Portal",
    secondaryTag: "Question",
  },
  {
    id: "keyword7",
    text: "Unspoken group assumptions",
    position: { x: 0.8, y: 0.65 },
    tag: "Lens",
  },
]

// Mock data for insights that appear when keywords are clicked
export const mockInsights = [
  {
    id: "keyword1",
    title: "Shared Understanding",
    content:
      "The group has strong alignment on core values and project goals, but divergent views on implementation approaches. There's explicit agreement on the 'what' but implicit tension around the 'how'.",
    source: "Dialogue analysis from last 3 sessions",
  },
  {
    id: "keyword2",
    title: "Decision Patterns",
    content:
      "The group tends to defer to expertise rather than building collective wisdom. Decision-making follows a hub-and-spoke model with 2-3 key voices, potentially missing distributed insights.",
    source: "Conversation flow analysis",
  },
  {
    id: "keyword3",
    title: "Group Dynamics",
    content:
      "A shift toward more collaborative sense-making is emerging. The group is moving from individual expertise sharing to collective intelligence building, with increased cross-pollination of ideas.",
    source: "Behavioral pattern recognition",
  },
  {
    id: "keyword4",
    title: "Hidden Consensus",
    content:
      "There's latent agreement on risk tolerance and innovation appetite that hasn't been explicitly surfaced. The group shares similar intuitions about market timing but hasn't verbalized this alignment.",
    source: "Sentiment and subtext analysis",
  },
  {
    id: "keyword5",
    title: "Mental Models",
    content:
      "The team operates with a shared framework around user-centricity and iterative development. These mental models are well-aligned and serve as a strong foundation for collective reasoning.",
    source: "Conceptual mapping of dialogue",
  },
  {
    id: "keyword6",
    title: "Unseen Possibilities",
    content:
      "The group's focus on immediate challenges may be limiting exploration of adjacent opportunities. There's potential for breakthrough thinking by connecting seemingly unrelated discussion threads.",
    source: "Possibility space analysis",
  },
  {
    id: "keyword7",
    title: "Group Assumptions",
    content:
      "Unexamined assumptions about user behavior and market conditions are influencing decisions. The group would benefit from surfacing and testing these implicit beliefs collectively.",
    source: "Assumption mapping from dialogue",
  },
]
