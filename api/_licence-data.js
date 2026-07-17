// Seed software-licence records (vendor contacts, PO numbers, licence keys).
// Kept server-side so this data isn't readable in the public client bundle;
// served to staff via the PIN-gated /api/licences endpoint. Staff-added
// licences live in the browser's localStorage, not here.

const DEFAULT_LICENCES = [
  {
    id: "corel_2026_01",
    software: "CorelDRAW Graphics Suite Education",
    vendor: "Learning Curve",
    vendorContact: "Phillip Mokgethi",
    vendorPhone: "+27 84 424 0772",
    poNumber: "RP0000122595",
    licenceNo: "1158587",
    importCode: "10690273",
    partNo: "LCCDGSSUBA11",
    seats: 2,
    effectiveDate: "2026-05-12",
    expiryDate: "2027-05-11",
    notes: "365-Day Subscription (Single User). Activate at coreldraw.com/licensemanagement. Keep this certificate for renewal reference.",
    createdAt: "2026-05-12T09:11:00.000Z",
  },
];

export { DEFAULT_LICENCES };
