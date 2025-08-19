import React from "react";
import SignsLibrary from "./SignsLibrary";
import LibraryModal from "./LibraryModal";
import LibrarySignDetail from "./LibrarySignDetail";
import UploadModal from "./UploadModal";
import UploadProgress from "./UploadProgress";
import InventoryModal from "./InventoryModal";
import SignCustomization from "./SignCustomization";
import { goldBalloon, letterA, baseball } from "./dummySignData";

const SignsScreens = () => {
	// Create an array of all sample signs
	const signs = [goldBalloon, letterA, baseball];

	const screens = [
		{
			id: 1,
			component: SignsLibrary,
			title: "Sign Library - Default View",
			props: { signs },
		},
		{
			id: 2,
			component: LibraryModal,
			title: "Sign Library - Add from Library Modal",
			props: { signs },
		},
		{
			id: 3,
			component: LibrarySignDetail,
			title: "Sign Library - Library Sign Detail View",
			props: { signs, selectedSign: signs[0] },
		},
		{
			id: 4,
			component: UploadModal,
			title: "Sign Library - Upload Custom Signs",
			props: { signs },
		},
		{
			id: 5,
			component: UploadProgress,
			title: "Sign Library - Upload Progress State",
			props: { signs },
		},
		{
			id: 6,
			component: InventoryModal,
			title: "Sign Library - Quick Inventory Management",
			props: { signs, selectedSign: signs[1] },
		},
		{
			id: 7,
			component: SignCustomization,
			title: "Sign Library - Edit Sign Details",
			props: { signs, selectedSign: signs[2] },
		},
	];

	return (
		<div className="signs-screens-container">
			{screens.map(({ id, component: Component, title, props }) => (
				<div
					key={id}
					className="screen-row"
				>
					<div className="screen-number">
						{id}. {title}
					</div>
					<Component {...props} />
				</div>
			))}
		</div>
	);
};

export default SignsScreens;
