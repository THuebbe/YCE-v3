import React, { useState } from "react";
import { Plus, Minus, Package, X } from "lucide-react";
import "./InventoryModal.css";

const InventoryModal = () => {
	const [inventory, setInventory] = useState(15);
	const [isOutOfStock, setIsOutOfStock] = useState(false);

	const handleIncrement = (amount = 1) => {
		if (!isOutOfStock) {
			setInventory((prev) => prev + amount);
		}
	};

	const handleDecrement = (amount = 1) => {
		if (!isOutOfStock && inventory >= amount) {
			setInventory((prev) => prev - amount);
		}
	};

	const handleOutOfStockToggle = () => {
		setIsOutOfStock((prev) => !prev);
		if (!isOutOfStock) {
			setInventory(0);
		} else {
			setInventory(1);
		}
	};

	const getInventoryStatus = () => {
		if (isOutOfStock || inventory === 0) return "out-of-stock";
		if (inventory < 10) return "low-stock";
		return "in-stock";
	};

	return (
		<div className="inventory-modal">
			<div className="modal-header">
				<h2>Manage Inventory</h2>
				<button className="close-button">
					<X size={24} />
				</button>
			</div>

			<div className="modal-content">
				<div className="inventory-display">
					<div className="current-count">
						<span className="count">{inventory}</span>
						<span className="label">Current Count</span>
					</div>
					<div
						className="status-badge"
						data-status={getInventoryStatus()}
					>
						{isOutOfStock
							? "Out of Stock"
							: inventory < 10
							? "Low Stock"
							: "In Stock"}
					</div>
				</div>

				<div className="inventory-controls">
					<div className="main-controls">
						<button
							className="control-button"
							onClick={() => handleDecrement()}
							disabled={isOutOfStock || inventory === 0}
						>
							<Minus size={20} />
						</button>
						<button
							className="control-button"
							onClick={() => handleIncrement()}
							disabled={isOutOfStock}
						>
							<Plus size={20} />
						</button>
					</div>

					<div className="quick-adjust">
						<button
							className="quick-button"
							onClick={() => handleIncrement(10)}
							disabled={isOutOfStock}
						>
							+10
						</button>
						<button
							className="quick-button"
							onClick={() => handleIncrement(25)}
							disabled={isOutOfStock}
						>
							+25
						</button>
						<button
							className="quick-button"
							onClick={() => handleIncrement(50)}
							disabled={isOutOfStock}
						>
							+50
						</button>
					</div>
				</div>

				<div className="out-of-stock-toggle">
					<label className="toggle-label">
						<input
							type="checkbox"
							checked={isOutOfStock}
							onChange={handleOutOfStockToggle}
						/>
						<span className="toggle-text">Mark as Out of Stock</span>
					</label>
				</div>
			</div>

			<div className="modal-footer">
				<button className="btn btn-secondary">Cancel</button>
				<button className="btn btn-primary">Save Changes</button>
			</div>
		</div>
	);
};

export default InventoryModal;
