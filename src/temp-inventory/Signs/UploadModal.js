import React, { useState, useCallback } from "react";
import { Upload, X, Tag, Package, FileText, Plus } from "lucide-react";
import "./UploadModal.css";

const UploadModal = () => {
	const [files, setFiles] = useState([]);
	const [batchPrefix, setBatchPrefix] = useState("");
	const [defaultTags, setDefaultTags] = useState("");
	const [initialInventory, setInitialInventory] = useState(1);
	const [isDragging, setIsDragging] = useState(false);

	const handleDragOver = useCallback((e) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback((e) => {
		e.preventDefault();
		setIsDragging(false);
		const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
			const validTypes = ["image/jpeg", "image/png", "image/webp"];
			const maxSize = 5 * 1024 * 1024; // 5MB
			return validTypes.includes(file.type) && file.size <= maxSize;
		});
		setFiles((prev) => [...prev, ...droppedFiles]);
	}, []);

	const handleFileSelect = useCallback((e) => {
		const selectedFiles = Array.from(e.target.files).filter((file) => {
			const validTypes = ["image/jpeg", "image/png", "image/webp"];
			const maxSize = 5 * 1024 * 1024; // 5MB
			return validTypes.includes(file.type) && file.size <= maxSize;
		});
		setFiles((prev) => [...prev, ...selectedFiles]);
	}, []);

	const removeFile = useCallback((index) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	return (
		<div className="upload-modal">
			<div className="upload-header">
				<h2>Upload Custom Signs</h2>
			</div>
			<div className="upload-content">
				{files.length === 0 ? (
					<label
						className={`drop-zone${isDragging ? " drag-over" : ""}`}
						htmlFor="file-upload"
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						tabIndex={0}
						style={{ cursor: "pointer" }}
					>
						<input
							type="file"
							id="file-upload"
							multiple
							accept=".jpg,.jpeg,.png,.webp"
							onChange={handleFileSelect}
							className="file-input"
							style={{ display: "none" }}
						/>
						<div className="drop-zone-content">
							<Upload size={48} />
							<p>Drag signs here or click to browse</p>
							<span className="file-types">
								Accepts .jpg, .png, .webp up to 5MB
							</span>
						</div>
					</label>
				) : (
					<>
						<div className="file-grid">
							{files.map((file, index) => (
								<div
									key={index}
									className="upload-file-card"
								>
									<div className="upload-file-preview">
										<img
											src={URL.createObjectURL(file)}
											alt={file.name}
										/>
										<button
											className="remove-file"
											onClick={() => removeFile(index)}
										>
											<X size={18} />
										</button>
									</div>
									<div className="file-info">
										<span className="file-name">{file.name}</span>
										<span className="file-size">
											{formatFileSize(file.size)}
										</span>
									</div>
								</div>
							))}
							<label
								className="upload-file-card upload-add-more-card"
								htmlFor="file-upload-more"
								tabIndex={0}
								style={{ cursor: "pointer" }}
							>
								<input
									type="file"
									id="file-upload-more"
									multiple
									accept=".jpg,.jpeg,.png,.webp"
									onChange={handleFileSelect}
									className="file-input"
									style={{ display: "none" }}
								/>
								<div className="add-more-content">
									<Plus size={32} />
									<span>Add More Files</span>
								</div>
							</label>
						</div>
						<div className="upload-settings">
							<div className="setting-group">
								<label htmlFor="batch-prefix">
									<FileText size={20} />
									Batch Name Prefix
								</label>
								<input
									type="text"
									id="batch-prefix"
									value={batchPrefix}
									onChange={(e) => setBatchPrefix(e.target.value)}
									placeholder="e.g., Summer Collection"
								/>
							</div>
							<div className="setting-group">
								<label htmlFor="default-tags">
									<Tag size={20} />
									Default Tags
								</label>
								<input
									type="text"
									id="default-tags"
									value={defaultTags}
									onChange={(e) => setDefaultTags(e.target.value)}
									placeholder="e.g., summer, outdoor, party"
								/>
							</div>
							<div className="setting-group">
								<label htmlFor="initial-inventory">
									<Package size={20} />
									Initial Inventory Count
								</label>
								<input
									type="number"
									id="initial-inventory"
									value={initialInventory}
									onChange={(e) =>
										setInitialInventory(
											Math.max(1, parseInt(e.target.value) || 1)
										)
									}
									min="1"
								/>
							</div>
						</div>
						<div className="upload-actions">
							<button
								className="btn btn-ghost"
								onClick={() => setFiles([])}
							>
								Clear All
							</button>
							<button className="btn btn-primary">Upload All</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default UploadModal;
