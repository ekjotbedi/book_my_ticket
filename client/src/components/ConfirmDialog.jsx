export default function ConfirmDialog({
  open,
  title = "Are you sure you want to cancel your tickets?",
  message,
  confirmLabel = "Yes",
  cancelLabel = "No",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="modal modal-open" role="dialog">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        {message && <p className="py-4">{message}</p>}
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={loading ? undefined : onCancel}
      ></div>
    </div>
  );
}
