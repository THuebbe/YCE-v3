import React, { useState, useEffect } from "react";
import { X, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import "./UploadProgress.css";

const UploadProgress = () => {
	// Mock data for demonstration
	const [files, setFiles] = useState([
		{
			id: 1,
			name: "beach-party-sign.jpg",
			size: 2456789,
			status: "uploading",
			progress: 45,
		},
		{
			id: 2,
			name: "summer-sale-sign.png",
			size: 1890456,
			status: "processing",
			progress: 100,
		},
		{
			id: 3,
			name: "grand-opening-sign.webp",
			size: 3123456,
			status: "success",
			progress: 100,
		},
		{
			id: 4,
			name: "clearance-sign.jpg",
			size: 1987654,
			status: "failed",
			progress: 0,
		},
	]);

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const handleRetry = (fileId) => {
		setFiles(
			files.map((file) =>
				file.id === fileId
					? { ...file, status: "uploading", progress: 0 }
					: file
			)
		);
	};

	const handleRetryAll = () => {
		setFiles(
			files.map((file) =>
				file.status === "failed"
					? { ...file, status: "uploading", progress: 0 }
					: file
			)
		);
	};

	const hasFailedUploads = files.some((file) => file.status === "failed");

	return (
		<div className="upload-progress">
			<div className="progress-header">
				<h2>Uploading Signs</h2>
				<div className="progress-stats">
					<span className="stat">
						<span className="stat-value">
							{files.filter((f) => f.status === "success").length}
						</span>
						<span className="stat-label">Completed</span>
					</span>
					<span className="stat">
						<span className="stat-value">
							{
								files.filter(
									(f) => f.status === "uploading" || f.status === "processing"
								).length
							}
						</span>
						<span className="stat-label">In Progress</span>
					</span>
					<span className="stat">
						<span className="stat-value">
							{files.filter((f) => f.status === "failed").length}
						</span>
						<span className="stat-label">Failed</span>
					</span>
				</div>
			</div>

			<div className="progress-content">
				<div className="files-list">
					{files.map((file) => (
						<div
							key={file.id}
							className="file-item"
						>
							<div className="file-preview">
								<div className="preview-placeholder">
									{file.name.split(".").pop().toUpperCase()}
								</div>
								<div className="file-status">
									{file.status === "uploading" && (
										<div className="status-icon uploading">
											<Loader2
												size={20}
												className="spinner"
											/>
										</div>
									)}
									{file.status === "processing" && (
										<div className="status-icon processing">
											<Loader2
												size={20}
												className="spinner"
											/>
										</div>
									)}
									{file.status === "success" && (
										<div className="status-icon success">
											<Check size={20} />
										</div>
									)}
									{file.status === "failed" && (
										<div className="status-icon failed">
											<AlertCircle size={20} />
										</div>
									)}
								</div>
							</div>
							<div className="file-details">
								<div className="file-info">
									<span className="file-name">{file.name}</span>
									<span className="file-size">{formatFileSize(file.size)}</span>
								</div>
								<div className="progress-bar">
									<div
										className="progress-fill"
										style={{ width: `${file.progress}%` }}
									/>
								</div>
								<div className="file-status-text">
									{file.status === "uploading" && "Uploading..."}
									{file.status === "processing" && "Processing..."}
									{file.status === "success" && "Upload complete"}
									{file.status === "failed" && (
										<button
											className="retry-button"
											onClick={() => handleRetry(file.id)}
										>
											<RefreshCw size={16} />
											Retry
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>

				{hasFailedUploads && (
					<div className="bulk-actions">
						<button
							className="btn btn-secondary"
							onClick={handleRetryAll}
						>
							<RefreshCw size={20} />
							Retry All Failed
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default UploadProgress;
