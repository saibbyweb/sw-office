import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

interface DeleteConfirmationModalProps {
  incident: any;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({ incident, onClose, onConfirm }: DeleteConfirmationModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiAlertTriangle className="w-6 h-6" />
            Delete Incident?
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold">Title:</span> {incident.title}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">User:</span> {incident.user?.name}
            </p>
          </div>

          <p className="text-sm text-gray-600">
            This action cannot be undone. The incident record will be permanently deleted.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl font-medium"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
