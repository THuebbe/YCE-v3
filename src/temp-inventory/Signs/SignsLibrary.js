import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Library,
	Upload,
	Search,
	Edit2,
	Trash2,
	Package,
	X,
	Check,
} from "lucide-react";
import "./SignsLibrary.css";

const SignsLibrary = () => {
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedFilter, setSelectedFilter] = useState("all");
	const [selectedSigns, setSelectedSigns] = useState([]);
	const [showLibraryModal, setShowLibraryModal] = useState(false);
	const [showUploadModal, setShowUploadModal] = useState(false);

	// Mock data for signs
	const signs = [
		{
			id: 1,
			name: "Welcome Home",
			image: "https://placehold.co/400x300",
			tags: ["Welcome", "Home"],
			source: "library",
			inventory: 5,
			status: "active",
		},
		{
			id: 2,
			name: "Happy Birthday",
			image: "https://placehold.co/400x400",
			tags: ["Birthday", "Celebration"],
			source: "custom",
			inventory: 3,
			status: "active",
		},
		{
			id: 3,
			name: "Congratulations",
			image: "https://placehold.co/300x400",
			tags: ["Graduation", "Achievement"],
			source: "library",
			inventory: 0,
			status: "active",
		},
	];

	const handleEditSign = (signId) => {
		navigate(`/signs/customize/${signId}`);
	};

	const handleManageInventory = (signId) => {
		// TODO: Implement inventory management modal
	};

	const handleRemoveSign = (signId) => {
		// TODO: Implement sign removal
	};

	const handleSelectSign = (signId) => {
		setSelectedSigns((prev) =>
			prev.includes(signId)
				? prev.filter((id) => id !== signId)
				: [...prev, signId]
		);
	};

	const handleSelectAll = () => {
		setSelectedSigns((prev) =>
			prev.length === signs.length ? [] : signs.map((sign) => sign.id)
		);
	};

	return (
		<div className="signs-library">
			{/* Header Section */}
			<div className="library-header">
				<h1>Sign Library</h1>
				<div className="header-actions">
					<button
						className="btn btn-secondary"
						onClick={() => setShowLibraryModal(true)}
					>
						<Library size={20} />
						Add from Library
					</button>
					<button
						className="btn btn-primary"
						onClick={() => setShowUploadModal(true)}
					>
						<Upload size={20} />
						Upload Custom
					</button>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="search-filters">
				<div className="search-bar">
					<Search size={20} />
					<input
						type="text"
						placeholder="Search your signs..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="filter-chips">
					<button
						className={`filter-chip ${
							selectedFilter === "all" ? "active" : ""
						}`}
						onClick={() => setSelectedFilter("all")}
					>
						All Signs
					</button>
					<button
						className={`filter-chip ${
							selectedFilter === "custom" ? "active" : ""
						}`}
						onClick={() => setSelectedFilter("custom")}
					>
						Custom Uploads
					</button>
					<button
						className={`filter-chip ${
							selectedFilter === "library" ? "active" : ""
						}`}
						onClick={() => setSelectedFilter("library")}
					>
						Library Signs
					</button>
				</div>
			</div>

			{/* Bulk Operations Toolbar */}
			{selectedSigns.length > 0 && (
				<div className="bulk-toolbar">
					<div className="bulk-left">
						<label className="checkbox-label">
							<input
								type="checkbox"
								checked={selectedSigns.length === signs.length}
								onChange={handleSelectAll}
							/>
							Select All
						</label>
						<span className="selected-count">
							{selectedSigns.length} selected
						</span>
					</div>
					<div className="bulk-actions">
						<button className="btn btn-secondary">
							<Package size={20} />
							Bulk Inventory
						</button>
						<button className="btn btn-secondary">
							<Edit2 size={20} />
							Bulk Tag
						</button>
						<button className="btn btn-danger">
							<Trash2 size={20} />
							Bulk Delete
						</button>
					</div>
				</div>
			)}

			{/* Signs Grid */}
			<div className="signs-grid">
				{signs.map((sign) => (
					<div
						key={sign.id}
						className={`sign-card ${
							selectedSigns.includes(sign.id) ? "selected" : ""
						}`}
					>
						<div className="sign-image">
							<img
								src={sign.image}
								alt={sign.name}
							/>
							<div className="sign-source">
								{sign.source === "library" ? "Library" : "Custom"}
							</div>
							<div className="sign-overlay">
								<button
									className="icon-button edit"
									onClick={() => handleEditSign(sign.id)}
									title="Edit Details"
								>
									<Edit2 size={20} />
								</button>
								<button
									className="icon-button inventory"
									onClick={() => handleManageInventory(sign.id)}
									title="Manage Inventory"
								>
									<Package size={20} />
								</button>
								<button
									className="icon-button delete"
									onClick={() => handleRemoveSign(sign.id)}
									title="Remove Sign"
								>
									<Trash2 size={20} />
								</button>
							</div>
							<button
								className="select-button"
								onClick={() => handleSelectSign(sign.id)}
							>
								{selectedSigns.includes(sign.id) ? (
									<Check size={20} />
								) : (
									<X size={20} />
								)}
							</button>
						</div>
						<div className="sign-info">
							<h3>{sign.name}</h3>
							<div className="sign-tags">
								{sign.tags.map((tag) => (
									<span
										key={tag}
										className="tag"
									>
										{tag}
									</span>
								))}
							</div>
							<div className="sign-inventory">
								<span
									className={`inventory-count ${
										sign.inventory === 0
											? "out-of-stock"
											: sign.inventory < 10
											? "low-stock"
											: ""
									}`}
								>
									{sign.inventory} in stock
								</span>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Empty State */}
			{signs.length === 0 && (
				<div className="empty-state">
					<img
						src="/empty-signs.svg"
						alt="No signs yet"
					/>
					<h3>No signs yet</h3>
					<p>Add from our library or upload your own!</p>
					<div className="empty-state-actions">
						<button
							className="btn btn-secondary"
							onClick={() => setShowLibraryModal(true)}
						>
							<Library size={20} />
							Add from Library
						</button>
						<button
							className="btn btn-primary"
							onClick={() => setShowUploadModal(true)}
						>
							<Upload size={20} />
							Upload Custom
						</button>
					</div>
				</div>
			)}

			{/* TODO: Add Library Modal */}
			{/* TODO: Add Upload Modal */}
		</div>
	);
};

export default SignsLibrary;
