
export type NavItem = {
	label: string;
	href: string;
	external?: boolean;
	newTab?: boolean;
};

export const navItems: NavItem[] = [
	{ label: "Home", href: "/" },
	{ label: "Docs", href: "/docs" },
	{ label: "Transactions", href: "/txs" },
];
