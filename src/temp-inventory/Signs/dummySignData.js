// Sample 1: Gold Balloon
export const goldBalloon = {
	id: "SIGN-001",
	name: "Gold Glitter Balloon",
	category: "decorative",
	subcategory: "balloon",
	character: null, // Not a letter
	dimensions: { height: 18, width: 14 },
	visualProperties: {
		primaryColor: "#FFD700",
		style: "modern",
	},
	themes: ["celebration", "birthday", "anniversary"],
	interests: [], // No specific interests for balloons
	ageGroups: ["kids", "teens", "adults"],
	displayTags: ["balloon", "gold", "glitter", "festive"],

	// Business properties with date-based reservations
	inventory: {
		total: 10,
		reservations: [
			{
				orderId: "ORD-123",
				quantity: 3,
				dates: {
					start: "2024-03-19",
					end: "2024-03-20",
				},
			},
			{
				orderId: "ORD-124",
				quantity: 2,
				dates: {
					start: "2024-03-25",
					end: "2024-03-26",
				},
			},
		],
	},

	// Status
	isActive: true,
	isCustom: false, // false for library signs, true for agency uploads
	agencyId: null, // null for library signs

	// Media
	images: {
		thumbnail: "/balloon-cluster-36in-Gold-Sparkle-Accessories-size1.png",
		preview: "/balloon-cluster-36in-Gold-Sparkle-Accessories-size1.png",
		full: "/balloon-cluster-36in-Gold-Sparkle-Accessories-size1.png",
	},

	// Metadata with full update history
	createdAt: "2024-01-15T10:00:00Z",
	updates: [
		{
			timestamp: "2024-01-20T14:30:00Z",
			action: "inventory_adjustment",
			details: "Increased total inventory from 8 to 10",
			userId: "USER-001",
		},
		{
			timestamp: "2024-02-05T09:15:00Z",
			action: "tags_updated",
			details: "Added 'festive' tag",
			userId: "USER-001",
		},
	],
};

// Sample 2: Letter A
export const letterA = {
	id: "SIGN-002",
	name: "Letter A - Red",
	category: "letter",
	subcategory: "alphabet",
	character: "A",
	dimensions: { height: 24, width: 20 },
	visualProperties: {
		primaryColor: "#FF0000",
		style: "bold",
	},
	themes: ["name", "initial", "personalization"],
	interests: [], // Letters don't have specific interests
	ageGroups: ["kids", "teens", "adults"],
	displayTags: ["letter", "alphabet", "red", "personalized"],

	// Business properties
	inventory: {
		total: 15,
		reservations: [
			{
				orderId: "ORD-125",
				quantity: 1,
				dates: {
					start: "2024-03-22",
					end: "2024-03-23",
				},
			},
		],
	},

	// Status
	isActive: true,
	isCustom: false,
	agencyId: null,

	// Media
	images: {
		thumbnail:
			"/A-solid-color-with-outline-24in-the-last-time-alphabet-yard-letter-set-26-pcs-239217.png",
		preview:
			"/A-solid-color-with-outline-24in-the-last-time-alphabet-yard-letter-set-26-pcs-239217.png",
		full: "/A-solid-color-with-outline-24in-the-last-time-alphabet-yard-letter-set-26-pcs-239217.png",
	},

	// Metadata
	createdAt: "2024-01-10T08:00:00Z",
	updates: [
		{
			timestamp: "2024-01-10T08:00:00Z",
			action: "sign_created",
			details: "Initial creation of Letter A - Red",
			userId: "SYSTEM",
		},
	],
};

// Sample 3: Baseball
export const baseball = {
	id: "SIGN-003",
	name: "Baseball",
	category: "themed",
	subcategory: "sport",
	character: null,
	dimensions: { height: 16, width: 16 },
	visualProperties: {
		primaryColor: "#FFFFFF",
		style: "realistic",
	},
	themes: ["sports", "baseball", "athletics"],
	interests: ["baseball", "sports"],
	ageGroups: ["kids", "teens", "adults"],
	displayTags: ["baseball", "sports", "white", "hobby"],

	// Business properties
	inventory: {
		total: 12,
		reservations: [
			{
				orderId: "ORD-126",
				quantity: 4,
				dates: {
					start: "2024-03-18",
					end: "2024-03-20",
				},
			},
			{
				orderId: "ORD-127",
				quantity: 2,
				dates: {
					start: "2024-03-19",
					end: "2024-03-19",
				},
			},
		],
	},

	// Status
	isActive: true,
	isCustom: false,
	agencyId: null,

	// Media
	images: {
		thumbnail:
			"/baseball-24in-sports-balls_ccd680e2-e4de-4081-998d-ad253cb08be2-sw.png",
		preview:
			"/baseball-24in-sports-balls_ccd680e2-e4de-4081-998d-ad253cb08be2-sw.png",
		full: "/baseball-24in-sports-balls_ccd680e2-e4de-4081-998d-ad253cb08be2-sw.png",
	},

	// Metadata
	createdAt: "2024-01-12T11:00:00Z",
	updates: [
		{
			timestamp: "2024-02-10T15:45:00Z",
			action: "inventory_adjustment",
			details: "Added 2 more units to inventory (10 to 12)",
			userId: "USER-001",
		},
		{
			timestamp: "2024-02-15T10:30:00Z",
			action: "category_change",
			details: "Changed subcategory from 'hobby' to 'sport'",
			userId: "USER-002",
		},
		{
			timestamp: "2024-03-01T09:00:00Z",
			action: "image_update",
			details: "Updated preview image for better quality",
			userId: "USER-001",
		},
	],
};
