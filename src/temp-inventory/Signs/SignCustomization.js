import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Download,
	Share2,
	Save,
	Undo,
	Redo,
	Type,
	Image,
	Palette,
	Layout,
} from "lucide-react";
import "./SignCustomization.css";

const SignCustomization = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("text");

	// Mock sign data - in a real app, this would come from an API
	const mockSign = {
		id,
		defaultText: "Welcome Home",
		defaultImage: "https://placehold.co/400x300",
		colors: ["#000000", "#ffffff", "#ffffff"],
	};

	const [customization, setCustomization] = useState({
		text: {
			content: mockSign.defaultText || "",
			font: "Arial",
			size: 24,
			color: "#000000",
			alignment: "center",
		},
		image: {
			url: mockSign.defaultImage || "",
			position: { x: 0, y: 0 },
			scale: 1,
			opacity: 1,
		},
		colors: {
			primary: mockSign.colors[0] || "#000000",
			secondary: mockSign.colors[1] || "#ffffff",
			background: mockSign.colors[2] || "#ffffff",
		},
		layout: {
			template: "default",
			spacing: "normal",
			orientation: "portrait",
		},
	});

	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	const handleChange = (section, field, value) => {
		const newCustomization = {
			...customization,
			[section]: {
				...customization[section],
				[field]: value,
			},
		};

		// Add to history
		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push(newCustomization);
		setHistory(newHistory);
		setHistoryIndex(newHistory.length - 1);

		setCustomization(newCustomization);
	};

	const handleUndo = () => {
		if (historyIndex > 0) {
			setHistoryIndex(historyIndex - 1);
			setCustomization(history[historyIndex - 1]);
		}
	};

	const handleRedo = () => {
		if (historyIndex < history.length - 1) {
			setHistoryIndex(historyIndex + 1);
			setCustomization(history[historyIndex + 1]);
		}
	};

	const handleSave = () => {
		// TODO: Implement save functionality
		console.log("Saving customization:", customization);
	};

	const handleShare = () => {
		// TODO: Implement share functionality
		console.log("Sharing customization");
	};

	const handleDownload = () => {
		// TODO: Implement download functionality
		console.log("Downloading customization");
	};

	const handleBack = () => {
		navigate("/signs");
	};

	return (
		<div className="sign-customization">
			<div className="customization-header">
				<button
					className="back-button"
					onClick={handleBack}
				>
					<ArrowLeft size={20} />
					Back to Library
				</button>
				<div className="header-actions">
					<button
						className="action-button"
						onClick={handleUndo}
						disabled={historyIndex <= 0}
					>
						<Undo size={20} />
					</button>
					<button
						className="action-button"
						onClick={handleRedo}
						disabled={historyIndex >= history.length - 1}
					>
						<Redo size={20} />
					</button>
					<button
						className="action-button"
						onClick={handleSave}
					>
						<Save size={20} />
					</button>
					<button
						className="action-button"
						onClick={handleShare}
					>
						<Share2 size={20} />
					</button>
					<button
						className="action-button primary"
						onClick={handleDownload}
					>
						<Download size={20} />
						Download
					</button>
				</div>
			</div>

			<div className="customization-content">
				<div className="preview-panel">
					<div
						className="preview-container"
						style={{ backgroundColor: customization.colors.background }}
					>
						{/* Preview content will be rendered here */}
						<div
							className="preview-text"
							style={{
								fontFamily: customization.text.font,
								fontSize: `${customization.text.size}px`,
								color: customization.text.color,
								textAlign: customization.text.alignment,
							}}
						>
							{customization.text.content}
						</div>
						{customization.image.url && (
							<img
								src={customization.image.url}
								alt="Custom"
								className="preview-image"
								style={{
									transform: `scale(${customization.image.scale})`,
									opacity: customization.image.opacity,
								}}
							/>
						)}
					</div>
				</div>

				<div className="controls-panel">
					<div className="tabs">
						<button
							className={`tab ${activeTab === "text" ? "active" : ""}`}
							onClick={() => setActiveTab("text")}
						>
							<Type size={20} />
							Text
						</button>
						<button
							className={`tab ${activeTab === "image" ? "active" : ""}`}
							onClick={() => setActiveTab("image")}
						>
							<Image size={20} alt="" />
							Image
						</button>
						<button
							className={`tab ${activeTab === "colors" ? "active" : ""}`}
							onClick={() => setActiveTab("colors")}
						>
							<Palette size={20} />
							Colors
						</button>
						<button
							className={`tab ${activeTab === "layout" ? "active" : ""}`}
							onClick={() => setActiveTab("layout")}
						>
							<Layout size={20} />
							Layout
						</button>
					</div>

					<div className="tab-content">
						{activeTab === "text" && (
							<div className="text-controls">
								<div className="control-group">
									<label>Text Content</label>
									<textarea
										value={customization.text.content}
										onChange={(e) =>
											handleChange("text", "content", e.target.value)
										}
										placeholder="Enter your text here..."
									/>
								</div>
								<div className="control-group">
									<label>Font</label>
									<select
										value={customization.text.font}
										onChange={(e) =>
											handleChange("text", "font", e.target.value)
										}
									>
										<option value="Arial">Arial</option>
										<option value="Helvetica">Helvetica</option>
										<option value="Times New Roman">Times New Roman</option>
										<option value="Georgia">Georgia</option>
									</select>
								</div>
								<div className="control-group">
									<label>Size</label>
									<input
										type="range"
										min="12"
										max="72"
										value={customization.text.size}
										onChange={(e) =>
											handleChange("text", "size", parseInt(e.target.value))
										}
									/>
									<span>{customization.text.size}px</span>
								</div>
								<div className="control-group">
									<label>Color</label>
									<input
										type="color"
										value={customization.text.color}
										onChange={(e) =>
											handleChange("text", "color", e.target.value)
										}
									/>
								</div>
								<div className="control-group">
									<label>Alignment</label>
									<div className="alignment-buttons">
										<button
											className={
												customization.text.alignment === "left" ? "active" : ""
											}
											onClick={() => handleChange("text", "alignment", "left")}
										>
											Left
										</button>
										<button
											className={
												customization.text.alignment === "center"
													? "active"
													: ""
											}
											onClick={() =>
												handleChange("text", "alignment", "center")
											}
										>
											Center
										</button>
										<button
											className={
												customization.text.alignment === "right" ? "active" : ""
											}
											onClick={() => handleChange("text", "alignment", "right")}
										>
											Right
										</button>
									</div>
								</div>
							</div>
						)}

						{activeTab === "image" && (
							<div className="image-controls">
								<div className="control-group">
									<label>Upload Image</label>
									<input
										type="file"
										accept="image/*"
										onChange={(e) => {
											const file = e.target.files[0];
											if (file) {
												const reader = new FileReader();
												reader.onload = (e) =>
													handleChange("image", "url", e.target.result);
												reader.readAsDataURL(file);
											}
										}}
									/>
								</div>
								<div className="control-group">
									<label>Scale</label>
									<input
										type="range"
										min="0.1"
										max="2"
										step="0.1"
										value={customization.image.scale}
										onChange={(e) =>
											handleChange("image", "scale", parseFloat(e.target.value))
										}
									/>
									<span>{Math.round(customization.image.scale * 100)}%</span>
								</div>
								<div className="control-group">
									<label>Opacity</label>
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										value={customization.image.opacity}
										onChange={(e) =>
											handleChange(
												"image",
												"opacity",
												parseFloat(e.target.value)
											)
										}
									/>
									<span>{Math.round(customization.image.opacity * 100)}%</span>
								</div>
							</div>
						)}

						{activeTab === "colors" && (
							<div className="color-controls">
								<div className="control-group">
									<label>Primary Color</label>
									<input
										type="color"
										value={customization.colors.primary}
										onChange={(e) =>
											handleChange("colors", "primary", e.target.value)
										}
									/>
								</div>
								<div className="control-group">
									<label>Secondary Color</label>
									<input
										type="color"
										value={customization.colors.secondary}
										onChange={(e) =>
											handleChange("colors", "secondary", e.target.value)
										}
									/>
								</div>
								<div className="control-group">
									<label>Background Color</label>
									<input
										type="color"
										value={customization.colors.background}
										onChange={(e) =>
											handleChange("colors", "background", e.target.value)
										}
									/>
								</div>
							</div>
						)}

						{activeTab === "layout" && (
							<div className="layout-controls">
								<div className="control-group">
									<label>Template</label>
									<select
										value={customization.layout.template}
										onChange={(e) =>
											handleChange("layout", "template", e.target.value)
										}
									>
										<option value="default">Default</option>
										<option value="modern">Modern</option>
										<option value="classic">Classic</option>
										<option value="minimal">Minimal</option>
									</select>
								</div>
								<div className="control-group">
									<label>Spacing</label>
									<select
										value={customization.layout.spacing}
										onChange={(e) =>
											handleChange("layout", "spacing", e.target.value)
										}
									>
										<option value="compact">Compact</option>
										<option value="normal">Normal</option>
										<option value="spacious">Spacious</option>
									</select>
								</div>
								<div className="control-group">
									<label>Orientation</label>
									<div className="orientation-buttons">
										<button
											className={
												customization.layout.orientation === "portrait"
													? "active"
													: ""
											}
											onClick={() =>
												handleChange("layout", "orientation", "portrait")
											}
										>
											Portrait
										</button>
										<button
											className={
												customization.layout.orientation === "landscape"
													? "active"
													: ""
											}
											onClick={() =>
												handleChange("layout", "orientation", "landscape")
											}
										>
											Landscape
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SignCustomization;
