import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/apiClient';
import {
  KeyIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [secretsCount, setSecretsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const secretsData = await apiClient.listSecrets(1, 0);
        setSecretsCount(secretsData.secrets.length);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    {
      name: 'My Secrets',
      value: loading ? '...' : secretsCount,
      icon: KeyIcon,
      link: '/secrets',
      color: 'bg-primary-500',
    },
  ];

  if (hasRole('admin')) {
    stats.push({
      name: 'Manage Users',
      value: 'Admin',
      icon: UsersIcon,
      link: '/users',
      color: 'bg-green-500',
    });
  }

  if (hasRole('admin') || hasRole('auditor')) {
    stats.push({
      name: 'Audit Logs',
      value: 'View',
      icon: ClipboardDocumentListIcon,
      link: '/audit',
      color: 'bg-yellow-500',
    });
  }

  return (
    <Layout>
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.username}!
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your encrypted secrets securely
        </p>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                to={stat.link}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <dt>
                  <div className={`absolute ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </dd>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              to="/secrets/new"
              className="relative rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <div className="flex items-center">
                <PlusIcon className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Create New Secret
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Store encrypted data securely
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/secrets"
              className="relative rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <div className="flex items-center">
                <KeyIcon className="h-6 w-6 text-primary-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    View All Secrets
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Access your encrypted secrets
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};