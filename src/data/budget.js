// ── BUDGET / ACE PANEL ───────────────────────────────────────────
const ACE_2026=[
  {no:1,item:"Sony A7IV + 28-70mm lens",use:"Digital cameras for teaching photography and documenting student artwork — high-resolution stills and video for assessment, exhibition, and research. Replace the department's failed Canon 5D bodies; entry-level Canon/Nikon bodies cascade to lower-year students.",type:"Replacement",assetNo:"RU015CGM, RU015CJH",qty:2,unitPrice:39995,total:79990,criticality:"Fundamental to photography and documentation-based teaching: without reliable cameras, students cannot create, present, or evaluate photographic and video work.",risk:"The high-end camera fleet has collapsed — three of four Canon 5D bodies have failed and only one ageing 5D Mark III remains. If it fails, the department has no high-end camera for senior teaching, assessment, and documentation.",growth:"Supports growing student numbers and the department's shift towards digital and hybrid art-making.",rating:5},
  {no:2,item:"Sony A6700 + 16-50mm lens",use:"Compact mirrorless for portable, high-quality video documentation across all Fine Art areas. The department's first modern mirrorless; the ageing camcorder cascades to lower-year students.",type:"Addition",assetNo:null,qty:1,unitPrice:24995,total:24995,criticality:"Important for video and moving-image teaching, workshops, and student research; the department has no modern mirrorless.",risk:"Without a modern mirrorless, students produce video on ageing, low-quality equipment — a recurring complaint, especially in low light — and the department cannot teach to current moving-image standards.",growth:"Expands learning opportunities for experimental video and hybrid media across all disciplines.",rating:4},
  {no:3,item:"DJI RS 4 Pro combo",use:"Professional gimbal stabiliser for smooth camera movement when documenting performances, installations, and student film.",type:"Addition",assetNo:null,qty:1,unitPrice:23295,total:23295,criticality:"Enables smooth, professional camera movement for documenting performances, installations, and student film work.",risk:"Without stabilisation, video documentation of performances and moving subjects is shaky and below professional standard.",growth:"Expands the department's ability to support video-based coursework and movement/performance projects.",rating:3},
  {no:4,item:"DJI OSMO Pocket 3 creator combo",use:"Compact, portable camera for quick documentation of installations, performances, and events. The Creator Combo includes its own carrying case.",type:"Addition",assetNo:null,qty:1,unitPrice:16695,total:16695,criticality:"A flexible, accessible camera for rapid run-and-gun documentation and student-led projects.",risk:"Without a compact camera, capturing smaller installations and off-site events quickly is harder, though larger cameras can cover this less conveniently.",growth:"Encourages student engagement with mobile and site-based practices.",rating:3},
  {no:5,item:"Lowepro Tahoe BP150 bag",use:"Protective camera backpacks for the two Sony A7IV bodies — safe transport between studios, classrooms, and off-site venues.",type:"Addition",assetNo:null,qty:2,unitPrice:2195,total:4390,criticality:"Protects valuable cameras used in teaching and student projects.",risk:"Without proper cases, the cameras are exposed to damage during transport and off-site work.",growth:"Improves logistics and flexible use of shared cameras across teaching spaces.",rating:3},
  {no:6,item:"Jenova modern shoulder bag",use:"Shoulder bag for the Sony A6700 — safe transport and handling in classes and fieldwork. Not for the Osmo, which includes its own case.",type:"Addition",assetNo:null,qty:1,unitPrice:2195,total:2195,criticality:"Supports safe handling and transport of the A6700 during classes, demonstrations, and fieldwork.",risk:"Without a proper case, the A6700 is exposed to accidental damage during transport.",growth:"Supports flexible use of the A6700 across teaching spaces.",rating:3},
  {no:7,item:"Smallrig 3824 battery charger kit",use:"NP-FZ100 2-battery kit with dual charger — one per high-end body so cameras can be charged and loaned out independently. All three new mirrorless bodies share the NP-FZ100 battery.",type:"Addition",assetNo:null,qty:2,unitPrice:1590,total:3180,criticality:"Keeps cameras powered and ready during teaching, documentation, and student loans.",risk:"A single charger would bottleneck the loan system — only one camera could be prepared at a time, delaying student access.",growth:"Supports simultaneous use of multiple cameras to meet increasing student demand.",rating:3},
  {no:8,item:"Smallrig 4336 cage for A6700",use:"Protective camera cage providing mounting points for lights, microphones, and accessories. Improves functionality and safety of the A6700 in multiple Fine Art teaching contexts.",type:"Addition",assetNo:null,qty:1,unitPrice:1495,total:1495,criticality:"Improves safety, functionality, and versatility of the A6700 for video teaching.",risk:"Cameras are more prone to wear and damage without a protective cage during student use.",growth:"Expands adaptability of cameras for advanced student projects using external accessories.",rating:3},
  {no:9,item:"Epson 4100lm FullHD projector (1920×1080)",use:"The department's first Full HD projector, for displaying student artwork, portfolios, and multimedia in high resolution for critiques, demonstrations, and workshops.",type:"Addition",assetNo:null,qty:1,unitPrice:13121,total:13121,criticality:"Supports teaching and presentation of student artwork, digital demonstrations, and multimedia in high resolution.",risk:"The department has no Full HD projection; existing projectors (including four 2023 EB-X49 units) are XGA 1024×768 and cannot render high-resolution visual work with adequate detail.",growth:"As the first Full HD projector, supports the shift to high-quality digital presentation across all sections.",rating:4},
  {no:10,item:"Epson soft carry case",use:"Carry case for the Full HD projector — safe transport between classrooms, studios, and exhibition spaces.",type:"Addition",assetNo:null,qty:1,unitPrice:1084,total:1084,criticality:"Not critical; serves only for safe transport.",risk:"Without it, the projector is more vulnerable to damage during movement between spaces.",growth:"Improves mobility and flexibility of projector use.",rating:2},
];

const IT_2026={
  current:[
    {pc:"Master PC",assetNo:"RU02NFSS",use:"Adobe video editing, photography, 3D works, laser engraving, assisting students with troubleshooting"},
    {pc:"Photo Printing PC",assetNo:"RU023C7B",use:"Photo printing workflow"},
    {pc:"Laser PC",assetNo:"RU023C7B",use:"Laser engraving previews and student support"},
  ],
  monitors:[
    {pc:"Master PC",assetNo:"RU02TGX7",spec:"27-inch, AdobeRGB, 1440p+, calibration capable",notes:"Supports video editing, 3D works, photography, laser engraving"},
    {pc:"Photo Printing PC",assetNo:"RU01A5QD",spec:"22-inch, AdobeRGB, Full HD, factory-calibrated preferred",notes:"Ensures accurate photo previews and prints; cost-effective"},
    {pc:"Laser PC",assetNo:"RU01GM4E",spec:"Reuse current Master monitor",notes:"Sufficient quality for laser engraving previews; resource optimisation"},
  ],
  towers:[
    {pc:"Master PC",spec:"Intel i7 / AMD Ryzen 7, 32GB+ RAM, dedicated GPU, ≥1TB SSD, Windows 11 Pro",notes:"Current tower (i5, 16GB, integrated GPU, 500GB SSD) struggles with urgent tasks. Example: Master's student video corrupted hours before exam; required re-edit, render, and export.",action:"New tower"},
    {pc:"Laser PC",spec:"Intel i5 / AMD Ryzen 5, 16GB RAM, integrated GPU, 512GB SSD, Windows 11 Pro",notes:"Provides stable performance for laser engraving workflows.",action:"New tower"},
    {pc:"Photo Printing PC",spec:"Current Master PC tower (RU02NFSS) repurposed",notes:"Existing tower sufficient; main requirement is high-quality monitor.",action:"Repurpose Master PC tower"},
  ],
  software:[
    {pc:"Master PC & Dedicated PC",software:"CorelDRAW Graphics Suite",purpose:"Vector graphics for design, photo editing, laser engraving prep",license:"Renewal, 2 seats",detail:"Part No: LCCDGSSUBA11 · Education 365-Day Subscription · Expiry: 14-04-2026"},
    {pc:"Master PC & Laser PC",software:"LightBurn",purpose:"Laser engraving file preparation and production",license:"One-off purchase, 3 seats (Master PC + Laser PC + 1 spare)",detail:"New purchase"},
  ],
  summary:[
    "Master PC receives high-performance tower and 27-inch AdobeRGB monitor for urgent, high-demand tasks.",
    "Current Master PC tower and monitor repurposed for Photo Printing PC and Laser PC — avoiding unnecessary expenditure.",
    "Laser PC receives cost-effective tower for reliable engraving workflows.",
    "CorelDRAW renewal and LightBurn one-off purchase ensure all PCs are fully capable.",
    "Optimises resources while improving workflow efficiency, print accuracy, and student support.",
  ],
};

const FE_2026=[
  {section:"First Year Studio",items:[
    {no:"FY-1",item:"Projector Ceiling Mount",use:"For presentations and crits; used by multiple sections.",type:"Addition",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3},
    {no:"FY-2",item:"Remote Projector Screen",use:"Improves presentation quality during teaching and student critiques.",type:"Addition",assetNo:null,qty:1,criticality:3,risk:1,urgency:3,rating:9},
    {no:"FY-3",item:"Blinds",use:"Light control for better visual display.",type:"Addition",assetNo:null,qty:2,criticality:5,risk:1,urgency:5,rating:25},
    {no:"FY-4",item:"Desk Rectangular 1600×800 (3 drawers)",use:"Replace old and unsightly office desk.",type:"Replacement",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3,office:true},
    {no:"FY-5",item:"Curtains",use:"Office curtains very old and faded; need replacement.",type:"Replacement",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3,office:true},
    {no:"FY-6",item:"Chair Highback helm contract with arms",use:"Replace office chair.",type:"Replacement",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3,office:true},
  ]},
  {section:"Painting Studio",items:[
    {no:"PA-1",item:"Dividers / Movable Walls",use:"Provide flexible studio layouts. Improves safety by creating clear working areas and separating materials and tools.",type:"Addition",assetNo:null,qty:4,criticality:5,risk:1,urgency:5,rating:25},
    {no:"PA-2",item:"Extractor Fan (Spray Booth)",use:"Ensures safe ventilation when using solvents and spray materials. Critical for health and safety compliance and air quality.",type:"Addition",assetNo:null,qty:1,criticality:3,risk:3,urgency:3,rating:27},
    {no:"PA-3",item:"Flammable Waste Cans",use:"Safe disposal for solvents and thinners. Essential to prevent fire hazards and meet safety regulations.",type:"Addition",assetNo:null,qty:6,criticality:5,risk:5,urgency:5,rating:125},
    {no:"PA-4",item:"Blinds",use:"No blinds in office windows; impossible to control light.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:1,urgency:3,rating:15,office:true},
  ]},
  {section:"Sculpture Studio",items:[
    {no:"SC-1",item:"L-Shaped Desk",use:"Returning to Sculpture office after 9 years; old desk unsuitable for office work.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:1,urgency:5,rating:25,office:true},
    {no:"SC-2",item:"High-Back Chair",use:"Current chair broken; needs ergonomic replacement for daily use.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75,office:true},
    {no:"SC-3",item:"Filing Cabinet",use:"Organised storage of departmental and teaching materials.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:1,urgency:5,rating:25,office:true},
    {no:"SC-4",item:"Blinds",use:"Existing blinds are paint-splattered, torn, and in disrepair.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:1,urgency:3,rating:15,office:true},
  ]},
  {section:"Photography Studio",items:[
    {no:"PH-1",item:"Parrat RT3030 A2 Rotary Trimmer",use:"Precision cutting tool for photographic and digital prints. Supports both Digital Arts and Photography. Important for accuracy and safety.",type:"Addition",assetNo:null,qty:2,criticality:5,risk:3,urgency:5,rating:75},
  ]},
  {section:"Digital Arts Studio",items:[
    {no:"DA-1",item:"Remote Projector Screen",use:"Enhances presentation and teaching quality during critiques and lectures. Shared by Photography and Digital Arts.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:1,urgency:3,rating:15},
    {no:"DA-2",item:"Projector Ceiling Mount",use:"Supports studio presentations and crits; improves efficiency.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:1,urgency:5,rating:25},
  ]},
  {section:"Print Studio",items:[
    {no:"PR-1",item:"Mat Cutter",use:"Precise cutting of prints and paper in the shared departmental workshop. Essential for framing and safe handling of sharp tools.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
  ]},
  {section:"Departmental Workshop / Lab",items:[
    {no:"DW-1",item:"3D Scanner",use:"Used across all sections for scanning sculptures, installations, and artworks for digital documentation. Supports research and exhibition preparation.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
    {no:"DW-2",item:"3D Printer",use:"Enables model-making and prototype creation. Shared tool supporting design development across sections and interdisciplinary collaboration.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
    {no:"DW-3",item:"CO₂ Laser Engraver",use:"Replaces the outdated 2014 model. Shared fabrication tool used by multiple sections for engraving and prototyping. Essential for modern digital fabrication and safety compliance.",type:"Replacement",assetNo:"RU021Y7V",qty:1,criticality:5,risk:5,urgency:5,rating:125},
    {no:"DW-4",item:"Heat Press / Sublimation Press",use:"Transfer digital designs onto paper/fabric. Promotes cross-media learning between Digital Arts and Printmaking.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
    {no:"DW-5",item:"Matterport 3D Camera Pro3",use:"Captures 3D scans for documentation of exhibitions and installations. Used across all sections to digitally archive work and improve departmental visibility.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:5,urgency:5,rating:125},
    {no:"DW-6",item:"Material Handling Trolley",use:"Used by the Technical Assistant, workshop staff, and students across all studios to safely transport heavy materials, sculptures, and equipment. Prevents injuries and damage to artworks.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
  ]},
];

export { ACE_2026, IT_2026, FE_2026 };
