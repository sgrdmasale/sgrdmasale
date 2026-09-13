import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const EMPTY_FORM = {
  name: '',
  percentage: '',
  active: true,
};

const TaxesManagement = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------------------------------------------------------
  // Show message
  // ---------------------------------------------------------

  const showSuccess = (message) => {
    setSuccess(message);
    setError('');

    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const showError = (message) => {
    setError(message);
    setSuccess('');

    setTimeout(() => {
      setError('');
    }, 5000);
  };

  // ---------------------------------------------------------
  // FETCH TAXES
  // ---------------------------------------------------------

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[TaxesManagement] Fetching taxes...');

      const response = await pb.collection('taxes').getList(
        1,
        500,
        {
          sort: '-created',
        }
      );

      console.log(
        '[TaxesManagement] GET response:',
        response
      );

      setTaxes(response?.items || []);
    } catch (err) {
      console.error(
        '[TaxesManagement] Fetch error:',
        err
      );

      showError(
        err?.message || 'Failed to load taxes.'
      );

      setTaxes([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // INITIAL LOAD
  // ---------------------------------------------------------

  useEffect(() => {
    fetchTaxes();
  }, []);

  // ---------------------------------------------------------
  // OPEN ADD FORM
  // ---------------------------------------------------------

  const handleAddTax = () => {
    setEditingTax(null);
    setFormData(EMPTY_FORM);
    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  // ---------------------------------------------------------
  // OPEN EDIT FORM
  // ---------------------------------------------------------

  const handleEditTax = (tax) => {
    setEditingTax(tax);

    setFormData({
      name: tax?.name || '',
      percentage:
        tax?.percentage !== undefined &&
        tax?.percentage !== null
          ? String(tax.percentage)
          : '',
      active:
        tax?.active !== undefined
          ? Boolean(tax.active)
          : true,
    });

    setError('');
    setSuccess('');
    setIsFormOpen(true);
  };

  // ---------------------------------------------------------
  // CLOSE FORM
  // ---------------------------------------------------------

  const handleCloseForm = () => {
    if (saving) return;

    setIsFormOpen(false);
    setEditingTax(null);
    setFormData(EMPTY_FORM);
    setError('');
  };

  // ---------------------------------------------------------
  // FORM INPUT
  // ---------------------------------------------------------

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // ---------------------------------------------------------
  // SAVE TAX
  // ---------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const name = formData.name.trim();
    const percentage = Number(formData.percentage);

    // Validation
    if (!name) {
      showError('Please enter a tax name.');
      return;
    }

    if (
      formData.percentage === '' ||
      !Number.isFinite(percentage)
    ) {
      showError('Please enter a valid tax percentage.');
      return;
    }

    if (percentage < 0 || percentage > 100) {
      showError(
        'Tax percentage must be between 0 and 100.'
      );
      return;
    }

    const payload = {
      name,
      percentage,
      active: Boolean(formData.active),
    };

    try {
      setSaving(true);

      console.log(
        '[TaxesManagement] Sending MongoDB payload:',
        payload
      );

      // ---------------------------------------------------
      // UPDATE EXISTING TAX
      // ---------------------------------------------------

      if (editingTax?.id) {
        const updatedTax =
          await pb.collection('taxes').update(
            editingTax.id,
            payload
          );

        console.log(
          '[TaxesManagement] Tax updated:',
          updatedTax
        );

        setTaxes((previous) =>
          previous.map((tax) =>
            tax.id === editingTax.id
              ? updatedTax
              : tax
          )
        );

        showSuccess('Tax updated successfully.');

        setIsFormOpen(false);
        setEditingTax(null);
        setFormData(EMPTY_FORM);
      }

      // ---------------------------------------------------
      // CREATE NEW TAX
      // ---------------------------------------------------

      else {
        const createdTax =
          await pb.collection('taxes').create(payload);

        console.log(
          '[TaxesManagement] Tax created:',
          createdTax
        );

        setTaxes((previous) => [
          createdTax,
          ...previous,
        ]);

        showSuccess('Tax created successfully.');

        setIsFormOpen(false);
        setFormData(EMPTY_FORM);
      }
    } catch (err) {
      console.error(
        '[TaxesManagement] Save error:',
        err
      );

      if (err?.status === 401) {
        showError(
          'Your admin session has expired. Please login again.'
        );
      } else if (err?.status === 403) {
        showError(
          'You are not authorized to manage taxes.'
        );
      } else {
        showError(
          err?.message || 'Failed to save tax.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE TAX
  // ---------------------------------------------------------

  const handleDelete = async (tax) => {
    if (!tax?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${tax.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeleting(tax.id);
      setError('');
      setSuccess('');

      console.log(
        '[TaxesManagement] Deleting tax:',
        tax.id
      );

      await pb.collection('taxes').delete(tax.id);

      console.log(
        '[TaxesManagement] Tax deleted:',
        tax.id
      );

      setTaxes((previous) =>
        previous.filter(
          (item) => item.id !== tax.id
        )
      );

      showSuccess('Tax deleted successfully.');
    } catch (err) {
      console.error(
        '[TaxesManagement] Delete error:',
        err
      );

      if (err?.status === 401) {
        showError(
          'Your admin session has expired. Please login again.'
        );
      } else if (err?.status === 403) {
        showError(
          'You are not authorized to delete taxes.'
        );
      } else {
        showError(
          err?.message || 'Failed to delete tax.'
        );
      }
    } finally {
      setDeleting(null);
    }
  };

  // ---------------------------------------------------------
  // TOGGLE TAX STATUS
  // ---------------------------------------------------------

  const handleToggleStatus = async (tax) => {
    if (!tax?.id) return;

    const newStatus = !Boolean(tax.active);

    try {
      setError('');
      setSuccess('');

      console.log(
        '[TaxesManagement] Changing tax status:',
        {
          id: tax.id,
          active: newStatus,
        }
      );

      const updatedTax =
        await pb.collection('taxes').update(
          tax.id,
          {
            active: newStatus,
          }
        );

      console.log(
        '[TaxesManagement] Status updated:',
        updatedTax
      );

      setTaxes((previous) =>
        previous.map((item) =>
          item.id === tax.id
            ? updatedTax
            : item
        )
      );

      showSuccess(
        `Tax ${
          newStatus ? 'activated' : 'deactivated'
        } successfully.`
      );
    } catch (err) {
      console.error(
        '[TaxesManagement] Status update error:',
        err
      );

      if (err?.status === 401) {
        showError(
          'Your admin session has expired. Please login again.'
        );
      } else if (err?.status === 403) {
        showError(
          'You are not authorized to change tax status.'
        );
      } else {
        showError(
          err?.message || 'Failed to update tax status.'
        );
      }
    }
  };

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-gray-500">
            Loading taxes...
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Taxes Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage tax rates used across your store.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTax}
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          + Add Tax
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TAX TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {taxes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-lg font-medium text-gray-900">
              No taxes found
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Add your first tax rate to get started.
            </p>

            <button
              type="button"
              onClick={handleAddTax}
              className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Add Tax
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tax Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Percentage
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {taxes.map((tax) => (
                  <tr
                    key={tax.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* NAME */}

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {tax.name}
                      </div>
                    </td>

                    {/* PERCENTAGE */}

                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {Number(tax.percentage)}%
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(tax)
                        }
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition ${
                          tax.active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tax.active
                          ? 'Active'
                          : 'Inactive'}
                      </button>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditTax(tax)
                          }
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(tax)
                          }
                          disabled={deleting === tax.id}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleting === tax.id
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTax
                    ? 'Edit Tax'
                    : 'Add Tax'}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the MongoDB tax details.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                disabled={saving}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6"
            >
              {/* TAX NAME */}

              <div>
                <label
                  htmlFor="tax-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Tax Name
                </label>

                <input
                  id="tax-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. GST"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                />
              </div>

              {/* TAX PERCENTAGE */}

              <div>
                <label
                  htmlFor="tax-percentage"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Tax Percentage
                </label>

                <div className="relative">
                  <input
                    id="tax-percentage"
                    name="percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.percentage}
                    onChange={handleChange}
                    placeholder="18"
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-100"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    %
                  </span>
                </div>
              </div>

              {/* STATUS */}

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  name="active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={handleChange}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300"
                />

                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>

              {/* FORM ERROR */}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingTax
                      ? 'Update Tax'
                      : 'Save Tax'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxesManagement;