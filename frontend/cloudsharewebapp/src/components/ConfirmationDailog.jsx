import Modal from "./Modal";
import React from "react";
const ConfirmationDialog = ({ isOpen, onClose, title="Confir Action" , message="Are you sure you want to proceed?",confirmText="Confirm",cancelText="Cancel",onConfirm,confirmationButtonClass="bg-red-600 hover:red-700"}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} confirmText={confirmText} cancelText={cancelText} onConfirm={onConfirm} confirmationButtonClass={confirmationButtonClass} size="sm">
        <p className="text-gray-600">{message}</p>
    </Modal>

    );
};
export default ConfirmationDialog;