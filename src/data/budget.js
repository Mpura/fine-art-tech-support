// ── BUDGET / ACE PANEL ───────────────────────────────────────────
const ACE_2026=[
  {no:1,item:"Sony A7IV + 28-70mm lens",use:"Digital cameras for photography teaching, artwork documentation, and student assessment across all Fine Art disciplines. Supersedes Canon 5D Mk II / III.",type:"Addition",assetNo:null,qty:2,unitPrice:39995,total:79990,criticality:"Fundamental to the delivery of photography and documentation-based teaching: Without reliable cameras, students cannot create, present, or evaluate photographic and video work.",risk:"Outdated DSLRs are unreliable and incompatible with current software, creating workflow disruptions and data-loss risks.",growth:"Supports growing student numbers and the department's shift towards digital and hybrid art-making.",rating:5},
  {no:2,item:"Sony A6700 + 16-50mm lens",use:"Compact mirrorless camera for video documentation of demonstrations and workshops requiring portability. Supports video and sound combined with traditional media.",type:"Addition",assetNo:null,qty:1,unitPrice:24995,total:24995,criticality:"Important for video and digital media instruction, workshops, and student research.",risk:"Lack of compact modern cameras limits moving image teaching and encourages unsafe improvisation with ageing DSLRs.",growth:"Expands learning opportunities for experimental video and hybrid media.",rating:5},
  {no:3,item:"DJI RS 4 Pro combo",use:"Professional gimbal stabiliser for smooth, high-quality camera movement in documentation and student video projects including installations, performances, and exhibitions.",type:"Addition",assetNo:null,qty:1,unitPrice:23295,total:23295,criticality:"Essential for stable camera operation in documentation of installations, performances, and student films.",risk:"Without stabilisation tools, students risk equipment damage and poor-quality documentation.",growth:"Expands the department's ability to support video-based coursework and interdisciplinary projects.",rating:5},
  {no:4,item:"DJI OSMO Pocket 3 creator combo",use:"Compact camera for quick documentation of installations, performances, and student projects both in and outside the studio. Useful across all Fine Art disciplines.",type:"Addition",assetNo:null,qty:1,unitPrice:16695,total:16695,criticality:"A flexible and accessible camera for rapid documentation and student-led projects.",risk:"Lacking compact portable cameras restricts capture of smaller installations and events.",growth:"Encourages student engagement with mobile and site-based practices.",rating:5},
  {no:5,item:"Lowepro Tahoe BP150 bag",use:"Protective backpack to transport cameras and accessories safely between studios, classrooms, and off-site venues. Shared departmental use.",type:"Addition",assetNo:null,qty:2,unitPrice:2195,total:4390,criticality:"Essential for protecting and extending the life of valuable cameras used in teaching.",risk:"Without protective transport, equipment is exposed to impact, dust, and moisture damage.",growth:"Improves logistics and equipment management across teaching spaces.",rating:4},
  {no:6,item:"Jenova modern shoulder bag",use:"Lightweight shoulder bag for compact camera kits used in classes and fieldwork. Supports easy handling and accessibility across all sections.",type:"Addition",assetNo:null,qty:1,unitPrice:2195,total:2195,criticality:"Supports safe handling and easy transport of smaller camera kits.",risk:"Unprotected transport increases likelihood of accidental damage.",growth:"Encourages student engagement with mobile and site-based practices.",rating:4},
  {no:7,item:"Smallrig 3824 battery charger kit",use:"Additional power supply for mirrorless cameras for extended teaching or documentation sessions. Ensures uninterrupted operation during exhibitions and student assessments.",type:"Addition",assetNo:null,qty:2,unitPrice:1590,total:3180,criticality:"Ensures cameras remain on continuously without disrupting class activities.",risk:"Limited battery capacity can lead to workflow interruptions, data loss, and project delays.",growth:"Supports simultaneous use of cameras and longer shooting sessions.",rating:4},
  {no:8,item:"Smallrig 4336 cage for A6700",use:"Protective camera cage providing mounting points for lights, microphones, and accessories. Improves functionality and safety of the A6700 in multiple Fine Art teaching contexts.",type:"Addition",assetNo:null,qty:1,unitPrice:1495,total:1495,criticality:"Improves safety, functionality, and versatility of the A6700 camera setup.",risk:"Cameras are more prone to wear and damage without a protective cage during student use.",growth:"Expands adaptability of cameras for advanced student projects.",rating:3},
  {no:9,item:"Epson 4100lm FullHD projector (1920×1080)",use:"First Full HD projector in the Fine Art department. Used to display student artwork, portfolios, and multimedia projects in high resolution for critiques, demonstrations, and workshops.",type:"Addition",assetNo:null,qty:3,unitPrice:13121,total:39363,criticality:"Essential for teaching and presenting student artwork and multimedia projects.",risk:"Current projectors are outdated or low resolution, making it difficult to display artwork clearly.",growth:"Being the first Full HD projector, supports shift to high-quality digital presentations and expanding student numbers.",rating:4},
  {no:10,item:"Epson soft carry case",use:"Optional carry bag for safe transport of the Epson 4100lm projector between classrooms, studios, and exhibition spaces.",type:"Addition",assetNo:null,qty:3,unitPrice:1084,total:3252,criticality:"Not critical; serves only for safe transport.",risk:"Without it, the projector is more vulnerable to damage during movement between spaces.",growth:"Improves mobility and flexibility of projector use.",rating:2},
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
