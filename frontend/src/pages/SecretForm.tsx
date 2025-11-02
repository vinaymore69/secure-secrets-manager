import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiClient } from '../api/apiClient';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const SecretForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchSecret = async () => {
        try {
          const data = await apiClient.getSecretMetadata(id!);
          setName(data.secret.name);
        } catch (err: any) {
          setError('Failed to load secret');
          console.error(err);
        } finally {
          setFetchLoading(false);
        }
      };

      fetchSecret();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        await apiClient.updateSecret(id!, name, plaintext || undefined);
      } else {
        await apiClient.createSecret(name, plaintext);
      }
      navigate('/secrets');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save secret');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/secrets"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Secrets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Secret' : 'Create New Secret'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isEdit
              ? 'Update the secret name or plaintext'
              : 'Securely store encrypted data'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Secret Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., Database Password, API Key"
              />
              <p className="mt-2 text-sm text-gray-500">
                A descriptive name to identify this secret
              </p>
            </div>

            <div>
              <label
                htmlFor="plaintext"
                className="block text-sm font-medium text-gray-700"
              >
                Secret Value {!isEdit && '*'}
              </label>
              <textarea
                id="plaintext"
                required={!isEdit}
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                rows={6}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
                placeholder="Enter your secret data here..."
              />
              <p className="mt-2 text-sm text-gray-500">
                {isEdit
                  ? 'Leave blank to keep the existing value'
                  : 'The data will be encrypted before storage'}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Security Note
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your secret will be encrypted using AES-256-GCM</li>
                      <li>Encryption keys are wrapped using KMS</li>
                      <li>All decrypt operations are logged for audit</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
            <Link
              to="/secrets"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Secret' : 'Create Secret'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};