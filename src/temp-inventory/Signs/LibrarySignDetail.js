import React, { useState } from "react";
import {
	X,
	Plus,
	Tag,
	Calendar,
	Users,
	Minus,
	Ruler,
	Palette,
	Target,
} from "lucide-react";
import "./LibrarySignDetail.css";

const LibrarySignDetail = ({ signs, selectedSign }) => {
	const [quantity, setQuantity] = useState(0);
	const [showError, setShowError] = useState(false);
	const [imageError, setImageError] = useState(false);

	// Use the selected sign or default to the first sign
	const sign = selectedSign || signs[0];

	// Handle image loading error
	const handleImageError = () => {
		setImageError(true);
	};

	// Helper function to get available inventory
	const getAvailableInventory = () => {
		const reserved = sign.inventory.reservations.reduce(
			(total, reservation) => {
				return total + reservation.quantity;
			},
			0
		);
		return sign.inventory.total - reserved;
	};

	// Helper function to format dimensions
	const formatDimensions = () => {
		return `${sign.dimensions.height}" × ${sign.dimensions.width}"`;
	};

	// Helper function to get related signs (excluding current sign)
	const getRelatedSigns = () => {
		return signs
			.filter((s) => s.id !== sign.id)
			.slice(0, 3)
			.map((s) => ({
				id: s.id,
				name: s.name,
				image: s.images.thumbnail,
				category: s.category,
				subcategory: s.subcategory,
			}));
	};

	const handleQuantityChange = (delta) => {
		const newQuantity = Math.max(0, quantity + delta);
		setQuantity(newQuantity);
		if (newQuantity > 0) {
			setShowError(false);
		}
	};

	const handleAddToLibrary = () => {
		if (quantity === 0) {
			setShowError(true);
			return;
		}
		// TODO: Implement add to library functionality
		console.log(`Adding ${quantity} signs to library`);
	};

	// Generate description based on sign properties
	const generateDescription = () => {
		const parts = [];

		if (sign.category === "letter") {
			parts.push(
				`A ${sign.visualProperties.style} letter "${sign.character}" in ${sign.visualProperties.primaryColor} color.`
			);
		} else if (sign.category === "decorative") {
			parts.push(
				`A ${sign.visualProperties.style} decorative ${sign.subcategory} sign.`
			);
		} else if (sign.category === "themed") {
			parts.push(
				`A ${sign.visualProperties.style} ${sign.subcategory} themed sign.`
			);
		}

		parts.push(`Perfect for ${sign.themes.join(", ")} events.`);
		parts.push(`Dimensions: ${formatDimensions()}.`);

		return parts.join(" ");
	};

	return (
		<div className="library-sign-detail">
			<div className="detail-header">
				<h2>Sign Details</h2>
				<button className="close-button">
					<X size={24} />
				</button>
			</div>

			<div className="detail-content">
				<div className="preview-section">
					<div className="preview-image">
						{imageError ? (
							<div className="image-placeholder">
								<span>Image not available</span>
							</div>
						) : (
							<img
								src={sign.images.preview}
								alt={sign.name}
								onError={handleImageError}
							/>
						)}
					</div>

					<div className="inventory-info">
						<h3>Inventory Status</h3>
						<div className="inventory-details">
							<div className="inventory-item">
								<strong>{sign.inventory.total}</strong>
								<span>Total Available</span>
							</div>
							<div className="inventory-item">
								<strong>{getAvailableInventory()}</strong>
								<span>Currently Available</span>
							</div>
							<div className="inventory-item">
								<strong>{sign.inventory.reservations.length}</strong>
								<span>Reserved Orders</span>
							</div>
						</div>

						<div className="inventory-properties">
							<div className="property-item">
								<Ruler size={16} />
								<span>
									<strong>Dimensions:</strong> {formatDimensions()}
								</span>
							</div>
							<div className="property-item">
								<Palette size={16} />
								<span>
									<strong>Primary Color:</strong>{" "}
									{sign.visualProperties.primaryColor}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="details-section">
					<div className="sign-header">
						<h1>{sign.name}</h1>
						<span className="category-badge">
							<Tag size={16} />
							{sign.category}
						</span>
					</div>

					<p className="description">{generateDescription()}</p>

					<div className="themes-sign-details-row">
						<div className="themes-column">
							<div className="themes-section">
								<h3>Themes & Uses</h3>
								<ul>
									{sign.themes.map((theme) => (
										<li key={theme}>
											<Calendar size={16} />
											{theme}
										</li>
									))}
								</ul>
							</div>
						</div>
						<div className="sign-details-container">
							<div className="tags-container">
								{sign.displayTags.map((tag) => (
									<span
										key={tag}
										className="tag"
									>
										{tag}
									</span>
								))}
							</div>
							<div className="sign-properties sign-properties-horizontal">
								<div className="property-item">
									<Target size={16} />
									<span>
										<strong>Style:</strong> {sign.visualProperties.style}
									</span>
								</div>
								<div className="property-item">
									<Users size={16} />
									<span>
										<strong>Age Groups:</strong> {sign.ageGroups.join(", ")}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="action-buttons-row">
						<div className="quantity-section">
							<div className="quantity-controls">
								<button
									className="quantity-btn"
									onClick={() => handleQuantityChange(-1)}
									disabled={quantity === 0}
								>
									<Minus size={20} />
								</button>
								<div className={`quantity-display ${showError ? "error" : ""}`}>
									{quantity}
								</div>
								<button
									className="quantity-btn"
									onClick={() => handleQuantityChange(1)}
								>
									<Plus size={20} />
								</button>
							</div>
							{showError && (
								<div className="error-message">
									Please select a quantity greater than 0
								</div>
							)}
						</div>
						<button
							className="btn btn-primary"
							onClick={handleAddToLibrary}
						>
							<Plus size={20} />
							Add to My Library
						</button>
					</div>
				</div>
			</div>

			<div className="related-signs">
				<h3>Related Signs</h3>
				<div className="related-grid">
					{getRelatedSigns().map((relatedSign) => (
						<div
							key={relatedSign.id}
							className="related-card"
						>
							<div className="related-image">
								<img
									src={relatedSign.image}
									alt={relatedSign.name}
								/>
							</div>
							<div className="related-info">
								<h4>{relatedSign.name}</h4>
								<span className="category">{relatedSign.category}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default LibrarySignDetail;
