'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import clsx from 'clsx';
import {
  HomeIcon,
  ListBulletIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ComputerDesktopIcon,
  BuildingStorefrontIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

const ownerNav = [
  { href: '/dashboard',            label: 'Overview',          icon: HomeIcon },
  { href: '/dashboard/menu',       label: 'Menu Items',        icon: ListBulletIcon },
  { href: '/dashboard/promotions', label: 'Promotions',        icon: MegaphoneIcon },
  { href: '/dashboard/display',    label: 'Display Settings',  icon: ComputerDesktopIcon },
  { href: '/dashboard/settings',   label: 'Settings',          icon: Cog6ToothIcon },
];

const superadminNav = [
  { href: '/dashboard',              label: 'Overview',    icon: HomeIcon },
  { href: '/dashboard/stores',       label: 'Stores',      icon: BuildingStorefrontIcon },
  { href: '/dashboard/categories',   label: 'Categories',  icon: TagIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const nav = user?.role === 'superadmin' ? superadminNav : ownerNav;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <img src="/logo.png" alt="Dynrow" className="h-10 w-auto object-contain flex-shrink-0" />
        <span className="text-lg font-bold tracking-tight">Dynrow</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-1">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <span className={clsx(
            'inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize',
            user?.role === 'superadmin'
              ? 'bg-purple-900 text-purple-300'
              : 'bg-blue-900 text-blue-300'
          )}>
            {user?.role}
          </span>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
