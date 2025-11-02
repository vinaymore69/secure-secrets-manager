import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiClient } from '../api/apiClient';
import {
  EyeIcon,
  EyeSlashIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export const SecretView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [secret, setSecret] = useState<any>(null);
  const [plaintext, setPlaintext] = useState<string>('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        const data = await apiClient.getSecretMetadata(id!);
        setSecret(data.secret);
      } catch (err: any) {
        setError('Failed to load secret');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSecret();
  }, [id]);

  const handleReveal = async () => {
    setRevealing(true);
    setError('');

    try {
      const data = await apiClient.revealSecret(id!);
      setPlaintext(data.plaintext);
      setRevealed(true);
    } catch (err: any) {
      setError('Failed to reveal secret');
      console.error(err);
    } finally {
      setRevealing(false);
    }
  };

  const handleHide = () => {
    setPlaintext('');
    setRevealed(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(plaintext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error && !secret) {
    return (
      <Layout>
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/secrets"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Secrets
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{secret.name}</h1>
              <p className="mt-2 text-sm text-gray-500">
                Created: {new Date(secret.created_at).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Updated: {new Date(secret.updated_at).toLocaleString()}
              </p>
            </div>
            <Link
              to={`/secrets/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Secret Content */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Secret Content
            </h3>

            {!revealed ? (
              <div className="text-center py-8">
                <EyeSlashIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Click to reveal the encrypted secret
                </p>
                <button
                  onClick={handleReveal}
                  disabled={revealing}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {revealing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <EyeIcon className="h-5 w-5 mr-2" />
                      Reveal Secret
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <textarea
                    readOnly
                    value={plaintext}
                    rows={6}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono bg-gray-50"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={handleHide}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <EyeSlashIcon className="h-5 w-5 mr-2" />
                    Hide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        {secret.metadata && Object.keys(secret.metadata).length > 0 && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Metadata
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                {Object.entries(secret.metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};