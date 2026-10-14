import { Outlet } from 'react-router-dom';
import { ASSETS } from '@/assets';
import { Logo, MetalMundiIcon } from '@/components/brand/logo';
import { Leaf, Recycle, ShieldCheck, Truck } from 'lucide-react';

const highlights = [
  { icon: Recycle, text: 'Verified collection of waste material' },
  { icon: ShieldCheck, text: 'Inspected, graded and fairly priced' },
  { icon: Truck, text: 'Processed materials delivered to industry' },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left hero banner matching Screen 1 (Login / Welcome Page) */}
      <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12 text-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700"
          style={{ backgroundImage: 'url(/bglogo.png)' }}
        />
        {/* Subtle dark gradient overlay to ensure perfect contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/60 to-slate-950/80 backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col items-center max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-3">
            <MetalMundiIcon className="h-20 w-20 drop-shadow-2xl" />
            <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              MetalMundi
            </h1>
            <p className="text-sm font-semibold tracking-widest text-amber-400 uppercase">
              Buy • Sell • Recycle
            </p>
          </div>

          <p className="text-base text-slate-200/90 leading-relaxed font-medium px-4">
            Connect with trusted buyers and sellers for a sustainable tomorrow.
          </p>
        </div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 sm:px-8">
        <div className="mb-8 w-full max-w-md lg:hidden">
          <Logo showWordmark />
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
