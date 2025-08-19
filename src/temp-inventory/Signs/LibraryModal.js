import React, { useState, useEffect } from "react";
import { Search, X, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import "./LibraryModal.css";

const LibraryModal = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [selectedColors, setSelectedColors] = useState([]);
	const [selectedThemes, setSelectedThemes] = useState([]);
	const [selectedSigns, setSelectedSigns] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	// Mock data for categories
	const categories = [
		"Birthday",
		"Wedding",
		"Holiday",
		"Graduation",
		"Baby",
		"Anniversary",
		"Business",
		"Sports",
	];

	// Mock data for colors
	const colors = [
		{ name: "Blue", value: "#2563EB" },
		{ name: "Pink", value: "#EC4899" },
		{ name: "Purple", value: "#8B5CF6" },
		{ name: "Teal", value: "#14B8A6" },
		{ name: "Yellow", value: "#FCD34D" },
	];

	// Mock data for themes
	const themes = [
		"Modern",
		"Vintage",
		"Rustic",
		"Elegant",
		"Playful",
		"Minimal",
		"Bold",
		"Whimsical",
	];

	// Mock data for library signs
	const librarySigns = [
		{
			id: 1,
			name: "Happy Birthday",
			category: "Birthday",
			image: "https://placehold.co/400x300",
			colors: ["#2563EB", "#EC4899"],
			themes: ["Modern", "Playful"],
			isAdded: false,
		},
		{
			id: 2,
			name: "Congratulations",
			category: "Graduation",
			image: "https://placehold.co/400x300",
			colors: ["#8B5CF6", "#14B8A6"],
			themes: ["Elegant", "Modern"],
			isAdded: true,
		},
		{
			id: 3,
			name: "Just Married",
			category: "Wedding",
			image: "https://placehold.co/400x300",
			colors: ["#EC4899", "#FCD34D"],
			themes: ["Elegant", "Romantic"],
			isAdded: false,
		},
		{
			id: 4,
			name: "Merry Christmas",
			category: "Holiday",
			image: "https://placehold.co/400x300",
			colors: ["#2563EB", "#14B8A6"],
			themes: ["Vintage", "Festive"],
			isAdded: false,
		},
		{
			id: 5,
			name: "Welcome Baby",
			category: "Baby",
			image: "https://placehold.co/400x300",
			colors: ["#EC4899", "#FCD34D"],
			themes: ["Playful", "Whimsical"],
			isAdded: false,
		},
		{
			id: 6,
			name: "Happy Anniversary",
			category: "Anniversary",
			image: "https://placehold.co/400x300",
			colors: ["#8B5CF6", "#EC4899"],
			themes: ["Elegant", "Romantic"],
			isAdded: false,
		},
	];

	// Debounced search
	useEffect(() => {
		const timer = setTimeout(() => {
			// TODO: Implement search functionality
			setIsLoading(false);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	const handleSearch = (e) => {
		setSearchQuery(e.target.value);
		setIsLoading(true);
	};

	const handleColorSelect = (color) => {
		setSelectedColors((prev) =>
			prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
		);
	};

	const handleThemeSelect = (theme) => {
		setSelectedThemes((prev) =>
			prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
		);
	};

	const handleSignSelect = (signId) => {
		setSelectedSigns((prev) =>
			prev.includes(signId)
				? prev.filter((id) => id !== signId)
				: [...prev, signId]
		);
	};

	return (
		<div className="library-modal">
			{/* Header */}
			<div className="modal-header">
				<h2>Add Signs from Library</h2>
				<button className="close-button">
					<X size={24} />
				</button>
			</div>

			{/* Search and Filters */}
			<div className="search-filters">
				<div className="search-bar">
					<Search size={20} />
					<input
						type="text"
						placeholder="Search library signs..."
						value={searchQuery}
						onChange={handleSearch}
					/>
					{isLoading && (
						<Loader2
							size={20}
							className="spinner"
						/>
					)}
				</div>

				<div className="filters">
					<div className="filter-group">
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="category-select"
						>
							<option value="">All Categories</option>
							{categories.map((category) => (
								<option
									key={category}
									value={category}
								>
									{category}
								</option>
							))}
						</select>
						<ChevronDown
							size={20}
							className="select-icon"
						/>
					</div>

					<div className="filter-chips">
						{colors.map((color) => (
							<button
								key={color.name}
								className={`color-chip ${
									selectedColors.includes(color.value) ? "active" : ""
								}`}
								onClick={() => handleColorSelect(color.value)}
								style={{ backgroundColor: color.value }}
								title={color.name}
							/>
						))}
					</div>

					<div className="filter-chips">
						{themes.map((theme) => (
							<button
								key={theme}
								className={`theme-chip ${
									selectedThemes.includes(theme) ? "active" : ""
								}`}
								onClick={() => handleThemeSelect(theme)}
							>
								{theme}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Signs Grid */}
			<div className="signs-grid">
				{librarySigns.map((sign) => (
					<div
						key={sign.id}
						className="sign-card"
					>
						<div className="sign-image">
							<img
								src={sign.image}
								alt={sign.name}
							/>
							<div className="sign-overlay">
								{sign.isAdded ? (
									<div className="added-badge">
										<Check size={20} />
										Added
									</div>
								) : (
									<button
										className="add-button"
										onClick={() => handleSignSelect(sign.id)}
									>
										<Plus size={20} />
										Add to Library
									</button>
								)}
							</div>
						</div>
						<div className="sign-info">
							<h3>{sign.name}</h3>
							<span className="category">{sign.category}</span>
						</div>
					</div>
				))}
			</div>

			{/* Footer */}
			<div className="modal-footer">
				<div className="selected-count">
					{selectedSigns.length} signs selected
				</div>
				<div className="footer-actions">
					<button className="btn btn-ghost">Cancel</button>
					<button className="btn btn-primary">Add Selected</button>
				</div>
			</div>
		</div>
	);
};

export default LibraryModal;
