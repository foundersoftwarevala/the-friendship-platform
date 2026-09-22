export type Tier = "Foundation" | "Advance" | "Elite" | "Legacy";

export interface TrophyStage {
  id: string;
  role: string;
  roleSlug: string;
  stage: number;
  name: string;
  tier: Tier;
  /** Art-direction brief used to render the asset. */
  brief: string;
}

export const TIERS: Tier[] = ["Foundation", "Advance", "Elite", "Legacy"];

export function tierForStage(stage: number): Tier {
  if (stage <= 3) return "Foundation";
  if (stage <= 6) return "Advance";
  if (stage <= 9) return "Elite";
  return "Legacy";
}

interface RoleDef {
  role: string;
  slug: string;
  /** Material / silhouette language unique to the role. */
  language: string;
  stages: string[];
  /** Ten distinct silhouettes, escalating in prestige. */
  forms: string[];
}

const ESCALATION = [
  "compact desk-scale award, restrained detailing, single material accent",
  "taller proportion, secondary material introduced, sharper edge work",
  "layered construction, engraved plate, refined bevels",
  "sculptural mid-scale award, dual-material contrast, internal detail",
  "monumental proportion, pierced negative space, precision inlay",
  "complex multi-axis form, floating element suspended in the structure",
  "gallery-scale award, deep optical crystal, mirror-polished metal armature",
  "architectural statement piece, cantilevered mass, illuminated internal core",
  "grand ceremonial award, intricate lattice, faceted crown geometry",
  "museum-grade legacy monument, tallest silhouette, black stone plinth, fine hand engraving",
];

const ROLES: RoleDef[] = [
  {
    role: "Developer",
    slug: "developer",
    language:
      "circuit geometry, digital architecture, abstract code structures, precision metalwork, crystal technology forms",
    stages: [
      "Code Initiate",
      "Code Builder",
      "Software Achiever",
      "Architecture Specialist",
      "Elite Engineer",
      "Systems Professional",
      "Engineering Champion",
      "Architecture Master",
      "Legendary Engineer",
      "Software Legacy",
    ],
    forms: [
      "a single tapered crystal blade rising from a brushed titanium block",
      "two interlocking machined metal brackets forming an abstract bracket glyph",
      "a stepped crystal ziggurat of stacked translucent plates",
      "an orbiting neural ring of polished steel around a frosted crystal core",
      "a stratified cloud-form of layered optical glass on a carbon plinth",
      "a pierced metal lattice column with a crystal spine running through it",
      "a twisted helical crystal shard held by four precision-milled arms",
      "a faceted obelisk of optical crystal split by a mirrored steel seam",
      "a woven double-helix of polished metal enclosing a floating crystal prism",
      "a monumental crystal architecture tower with engraved circuit tracery on black granite",
    ],
  },
  {
    role: "Reseller",
    slug: "reseller",
    language:
      "premium business geometry, growth forms, connected network structures, enterprise abstraction, luxury metallic finishes",
    stages: [
      "Sales Initiate",
      "Growth Partner",
      "Sales Achiever",
      "Market Specialist",
      "Elite Reseller",
      "Revenue Professional",
      "Sales Champion",
      "Growth Master",
      "Legendary Partner",
      "Global Sales Legacy",
    ],
    forms: [
      "a rising angled crystal wedge on a slim steel bar",
      "three ascending polished metal fins in staggered rhythm",
      "an upward crystal arc springing from a machined bronze base",
      "a spiral of graduated metal rings climbing a crystal shaft",
      "an interlocking cube-lattice of brushed metal and clear crystal",
      "a soaring twin-blade crystal form joined by a gold-plated node",
      "a crystal summit peak with terraced polished metal contours",
      "a network of connected metal nodes orbiting a crystal sphere",
      "a laurel-inspired abstract metal ribbon cradling a faceted crystal drop",
      "a towering crystal monolith with cascading gilded growth ribbons on black stone",
    ],
  },
  {
    role: "Franchise",
    slug: "franchise",
    language:
      "global network geometry, connected nodes, abstract world and grid forms, restrained crown geometry",
    stages: [
      "Territory Growth",
      "Network Expansion",
      "Enterprise Partner",
      "Regional Leader",
      "Global Expansion",
      "Network Champion",
      "Market Builder",
      "Global Operator",
      "Franchise Legend",
      "Expansion Legacy",
    ],
    forms: [
      "a flat crystal territory tile lifted on three steel pins",
      "a hexagonal node cluster in brushed metal on crystal",
      "an expanding grid plane folding upward into polished steel",
      "a crystal hemisphere gridded with fine engraved meridians",
      "a full crystal globe held in an open machined metal meridian ring",
      "intersecting metal orbit bands around a frosted crystal core",
      "a rising city-grid relief carved into a solid crystal slab",
      "a dual-globe composition linked by a polished metal bridge",
      "a faceted crystal sphere in a gilded lattice cage",
      "a monumental gridded crystal world column on a black stone plinth with engraved meridians",
    ],
  },
  {
    role: "Author",
    slug: "author",
    language:
      "abstract knowledge geometry, folded planes, layered strata, engraved line work — never a literal book",
    stages: [
      "Published Contributor",
      "Knowledge Builder",
      "Documentation Master",
      "Content Architect",
      "Thought Leader",
      "Editorial Elite",
      "Knowledge Champion",
      "Industry Voice",
      "Authoring Legend",
      "Knowledge Legacy",
    ],
    forms: [
      "a single folded crystal plane on a slim metal rail",
      "two offset crystal leaves fanned from a steel spine",
      "a stack of graduated translucent glass strata",
      "a spiralled metal ribbon unfurling from a crystal core",
      "an open crystal fan of thin vertical blades",
      "a pierced metal column engraved with abstract line script",
      "a suspended crystal quill-abstraction held by mirrored arms",
      "an unfolding crystal origami form with gold-leafed inner faces",
      "a radial crystal starburst of thin engraved plates",
      "a monumental fanned crystal archive wall on black stone with fine engraving",
    ],
  },
  {
    role: "Vendor",
    slug: "vendor",
    language:
      "premium digital-commerce symbolism, exchange geometry, modular product forms — no literal shops or bags",
    stages: [
      "Software Marketplace",
      "Product Excellence",
      "Trusted Partner",
      "Marketplace Champion",
      "Enterprise Vendor",
      "Distribution Leader",
      "Global Vendor",
      "Software Commerce Elite",
      "Marketplace Legend",
      "Vendor Legacy",
    ],
    forms: [
      "a single crystal module seated in a machined metal socket",
      "three modular crystal blocks in a stepped metal tray",
      "a sealed crystal capsule ringed with a gold band",
      "interlocking crystal tiles forming an abstract exchange grid",
      "a radial distribution burst of polished metal spokes and crystal tips",
      "a crystal prism suspended inside an open metal exchange frame",
      "a multi-facet crystal marketplace cluster on a mirrored base",
      "a crystal vault-form with precision-milled metal ribs",
      "a faceted crystal keystone crowned by a thin gilded arc",
      "a monumental modular crystal colonnade on black granite with engraved plate",
    ],
  },
  {
    role: "Affiliate",
    slug: "affiliate",
    language: "link geometry, chained abstract forms, referral arcs, luxury metal finishes",
    stages: [
      "First Referral",
      "Growing Reach",
      "Conversion Performer",
      "Revenue Partner",
      "Network Builder",
      "Elite Affiliate",
      "Traffic Champion",
      "Global Affiliate",
      "Affiliate Legend",
      "Referral Legacy",
    ],
    forms: [
      "a single crystal link resting in a steel cradle",
      "two interlocked polished metal rings on a crystal base",
      "an arcing metal chain of three fused abstract links",
      "a crystal torus threaded by a mirrored metal bar",
      "a chain of graduated crystal links rising vertically",
      "intertwined dual metal ribbons around a crystal shard",
      "a radiating burst of thin metal links from a crystal heart",
      "a suspended crystal node in a woven metal link cage",
      "a knotted infinity form in gilded metal with crystal inlay",
      "a monumental interlocked crystal-and-gold link tower on black stone",
    ],
  },
  {
    role: "Influencer",
    slug: "influencer",
    language: "signal geometry, resonance waves, broadcast abstraction, mirror-polished metal",
    stages: [
      "Signal Start",
      "Audience Growth",
      "Engagement Performer",
      "Reach Champion",
      "Brand Amplifier",
      "Elite Influencer",
      "Culture Leader",
      "Global Voice",
      "Influence Legend",
      "Influence Legacy",
    ],
    forms: [
      "a single thin crystal wave blade on a steel foot",
      "concentric metal ripple rings on a crystal disc",
      "a rising cluster of graduated crystal signal bars",
      "an expanding metal wave-front sculpted in polished steel",
      "a crystal sphere emitting engraved radial waves",
      "a pierced metal resonance shell around a crystal core",
      "layered crystal wave planes fanned in mirrored steel",
      "a suspended crystal orb inside broadcasting metal arcs",
      "a gilded amplitude sculpture with faceted crystal peaks",
      "a monumental resonance monolith of crystal waves on black stone",
    ],
  },
  {
    role: "Creator",
    slug: "creator",
    language: "generative geometry, sculpted facets, creative abstraction, mixed metal and crystal",
    stages: [
      "First Creation",
      "Craft Builder",
      "Design Performer",
      "Creative Champion",
      "Studio Elite",
      "Signature Style",
      "Creative Leader",
      "Global Creator",
      "Creator Legend",
      "Creator Legacy",
    ],
    forms: [
      "a rough-hewn crystal shard emerging from a smooth metal block",
      "a faceted crystal seed cradled by two curved metal petals",
      "an unfolding polygonal crystal bloom",
      "a twisted metal ribbon sweeping around a crystal ovoid",
      "a fractured crystal form reassembled with gold seams",
      "a generative lattice of crystal cells in a steel frame",
      "a spiral of graduated crystal facets on a mirrored column",
      "an asymmetric sculpted crystal wing on a machined pedestal",
      "a blossoming crystal geode with gilded interior facets",
      "a monumental sculpted crystal bloom on black stone with fine engraving",
    ],
  },
  {
    role: "SEO",
    slug: "seo",
    language: "index geometry, ranking ascents, crawl-graph abstraction, precision metalwork",
    stages: [
      "Index Ready",
      "Ranking Growth",
      "Traffic Performer",
      "Visibility Champion",
      "Search Strategist",
      "Elite Optimizer",
      "Authority Leader",
      "Global Visibility",
      "Search Legend",
      "Search Legacy",
    ],
    forms: [
      "a single ascending crystal step on a steel bar",
      "three graduated crystal rank blocks in a metal rail",
      "a rising metal arrow abstraction piercing a crystal plate",
      "a crystal magnifier-disc abstraction in a machined ring",
      "a radial crawl-graph of thin metal spokes and crystal nodes",
      "an ascending helix of crystal steps around a steel core",
      "a pierced metal index grid with crystal cell inlays",
      "a faceted crystal peak crowned by a gilded summit marker",
      "a layered crystal ranking mountain with engraved contour lines",
      "a monumental crystal ascent column on black stone with engraved index tracery",
    ],
  },
  {
    role: "Support",
    slug: "support",
    language: "shield and resolve geometry, protective arcs, calm precision — no headsets",
    stages: [
      "First Resolution",
      "Response Performer",
      "Customer Advocate",
      "Resolution Champion",
      "Service Elite",
      "Escalation Master",
      "Support Leader",
      "Global Support",
      "Service Legend",
      "Service Legacy",
    ],
    forms: [
      "a small crystal shield plate upright in a steel base",
      "two overlapping crystal arcs forming a protective curve",
      "a domed crystal canopy on a brushed metal ring",
      "a crystal core enclosed by four polished metal guards",
      "a pierced metal aegis with crystal center inlay",
      "concentric crystal shells around a glowing frosted core",
      "a faceted crystal shield in a mirrored steel armature",
      "a layered crystal bastion with gold-edged bevels",
      "a soaring crystal guardian form with gilded ribwork",
      "a monumental crystal aegis monolith on black stone with engraved plate",
    ],
  },
  {
    role: "User",
    slug: "user",
    language: "membership geometry, refined minimal forms, quiet luxury materials",
    stages: [
      "Welcome Member",
      "Active Member",
      "Engaged Member",
      "Valued Member",
      "Premium Member",
      "Elite Member",
      "Distinguished Member",
      "Global Member",
      "Member Legend",
      "Member Legacy",
    ],
    forms: [
      "a small polished crystal pebble on a slim steel plinth",
      "a crystal disc standing in a machined metal notch",
      "a rounded crystal column with a brushed metal collar",
      "a crystal ovoid cradled by a curved steel arc",
      "a faceted crystal droplet on a mirrored base",
      "a crystal cylinder banded with a fine gold ring",
      "a tapered crystal spire in a precision metal socket",
      "a double crystal form joined by a polished metal seam",
      "a faceted crystal star-form on a slim gilded stem",
      "a monumental smooth crystal monolith on black stone with subtle engraving",
    ],
  },
];

export const ROLE_LIST = ROLES.map((r) => ({ role: r.role, slug: r.slug }));

export const TROPHIES: TrophyStage[] = ROLES.flatMap((r) =>
  r.stages.map((name, i) => {
    const stage = i + 1;
    return {
      id: `${r.slug}-${String(stage).padStart(2, "0")}`,
      role: r.role,
      roleSlug: r.slug,
      stage,
      name,
      tier: tierForStage(stage),
      brief: `Ultra-premium corporate technology award trophy: ${r.forms[i]}. ${ESCALATION[i]}. Design language: ${r.language}. Materials: precision brushed and mirror-polished metal, optical crystal, black premium stone base, fine engraving, micro-detail. Cinematic studio product photography, dark seamless studio background, realistic reflections and shadows, strong silhouette, no text, no logos, no people.`,
    };
  }),
);
