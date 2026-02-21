'use client';

import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { storeApi, menuApi, promotionApi, superadminApi } from '@/lib/api';
import {
  ShoppingBagIcon,
  MegaphoneIcon,
  ComputerDesktopIcon,
  ArrowTrendingUpIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import Link from 'next/link';

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function SuperAdminOverview() {
  const { data: stores } = useQuery({
    queryKey: ['all-stores'],
    queryFn: () => superadminApi.getStores().then((r) => r.data.data),
    retry: false,
  });
  const { data: owners } = useQuery({
    queryKey: ['all-owners'],
    queryFn: () => superadminApi.getOwners().then((r) => r.data.data),
    retry: false,
  });

  const totalStores = Array.isArray(stores) ? stores.length : 0;
  const activeStores = Array.isArray(stores) ? stores.filter((s: { is_active: boolean }) => s.is_active).length : 0;
  const totalOwners = Array.isArray(owners) ? owners.length : 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BuildingStorefrontIcon} label="Total Stores"   value={totalStores}  color="bg-blue-500" />
        <StatCard icon={ArrowTrendingUpIcon}    label="Active Stores"  value={activeStores} color="bg-green-500" />
        <StatCard icon={UsersIcon}              label="Store Owners"   value={totalOwners}  color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Stores</h2>
          <Link href="/dashboard/stores" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {Array.isArray(stores) && stores.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b">
                <th className="pb-2 font-medium">Store</th>
                <th className="pb-2 font-medium">Owner</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stores.slice(0, 5).map((s: { _id: string; name: string; is_active: boolean; owner_id: { name: string; email: string } }) => (
                <tr key={s._id}>
                  <td className="py-2.5 font-medium text-gray-900">{s.name}</td>
                  <td className="py-2.5 text-gray-500">{s.owner_id?.name || '—'}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.is_active ? '● Live' : '○ Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            No stores yet.{' '}
            <Link href="/dashboard/stores" className="text-blue-600 hover:underline">Add one →</Link>
          </p>
        )}
      </div>
    </>
  );
}

function OwnerOverview() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: storeData } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => storeApi.getMyStore().then((r) => r.data.data),
    retry: false,
  });
  const { data: menuData } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => menuApi.getItems().then((r) => r.data.data),
    retry: false,
  });
  const { data: promoData } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionApi.getAll().then((r) => r.data.data),
    retry: false,
  });

  const totalItems  = Array.isArray(menuData)  ? menuData.length : 0;
  const activePromos = Array.isArray(promoData) ? promoData.filter((p: { is_active: boolean }) => p.is_active).length : 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ShoppingBagIcon}     label="Menu Items"    value={totalItems}   color="bg-blue-500" />
        <StatCard icon={MegaphoneIcon}       label="Active Promos" value={activePromos} color="bg-green-500" />
        <StatCard icon={ComputerDesktopIcon} label="Display Screens" value={1}          color="bg-purple-500" />
        <StatCard icon={ArrowTrendingUpIcon} label="Store Status"  value={storeData?.is_active ? 'Live' : 'Offline'} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: '+ Add menu item',    href: '/dashboard/menu' },
              { label: '+ Create promotion', href: '/dashboard/promotions' },
              { label: '⚙ Store settings',  href: '/dashboard/settings' },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-sm text-gray-700 transition-colors">
                {label}
                <span className="text-gray-400">→</span>
              </a>
            ))}
            {storeData?._id && (
              <a
                href={`http://localhost:3001/${storeData._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-sm text-purple-700 transition-colors"
              >
                <span>📺 Open display screen</span>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-400" />
              </a>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Store Info</h2>
          {storeData ? (
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Store Name', value: storeData.name },
                { label: 'Timezone',   value: storeData.timezone },
                { label: 'Status',     value: storeData.is_active ? '🟢 Active' : '🔴 Inactive' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                <dt className="text-gray-500">Display URL</dt>
                <dd className="flex items-center gap-1.5">
                  <a
                    href={`http://localhost:3001/${storeData._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 hover:underline truncate max-w-[160px]"
                    title={`http://localhost:3001/${storeData._id}`}
                  >
                    localhost:3001/{storeData._id}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:3001/${storeData._id}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    title="Copy URL"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                  {copied && <span className="text-xs text-green-600">Copied!</span>}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              <p>No store set up yet.</p>
              <a href="/dashboard/settings" className="text-blue-600 hover:underline mt-1 block">Set up your store →</a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.role === 'superadmin' ? 'Dynaro platform overview' : 'Here\'s an overview of your store'}
        </p>
      </div>

      {user?.role === 'superadmin' ? <SuperAdminOverview /> : <OwnerOverview />}
    </div>
  );
}
