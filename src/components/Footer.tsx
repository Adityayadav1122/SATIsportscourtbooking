export default function Footer() {
  return (
    <footer className="border-t border-pine-800/20 bg-pine-950 text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-bold uppercase text-white">
              SATI Sports Hall
            </p>
            <p className="mt-1 text-sm leading-relaxed">
              Samrat Ashok Technological Institute Vidisha
              <br />
              Sports Hall · Slot Booking
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Hall timings</p>
            <p className="mt-1">
              Morning · 7:00 AM – 10:00 AM
              <br />
              Evening · 3:00 PM – 8:00 PM
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-white">Facilities</p>
            <p className="mt-1">
              🏸 Badminton Court · 🏓 Table Tennis · 🏏 Cricket Net
            </p>
          </div>
        </div>
        <p className="mt-8 border-t border-white/10 pt-5 text-xs text-white/50">
          © {new Date().getFullYear()} Sports Hall, Samrat Ashok Technological
          Institute, Vidisha. One hour, one slot, fair play for everyone.
        </p>
      </div>
    </footer>
  );
}