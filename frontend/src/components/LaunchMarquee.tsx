import { Link } from "react-router-dom";

export function LaunchMarquee() {
  const message = "🚀 LAUNCH OFFER: Use code FREE_100 at checkout for 100% OFF all paid plans — Limited time only!  ";

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white overflow-hidden whitespace-nowrap">
      <div className="animate-marquee inline-flex py-2 text-sm font-bold tracking-wide">
        {Array.from({ length: 6 }).map((_, i) => (
          <Link key={i} to="/pricing" className="hover:underline">
            {message}
          </Link>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
