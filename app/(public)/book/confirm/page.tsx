import Link from "next/link";
import { CheckCircle, MessageSquare, MapPin } from "lucide-react";

export default function BookingConfirmation() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>

      <h1 className="text-2xl font-bold mt-6">Booking confirmed!</h1>
      <p className="text-gray-500 mt-2">
        Your dumpster rental has been submitted. We&apos;ll review and confirm
        within the hour.
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 p-6 text-left space-y-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-tippd-blue mt-0.5" />
          <div>
            <p className="font-medium text-sm">SMS confirmation sent</p>
            <p className="text-sm text-gray-500">
              You&apos;ll receive a text with your job ID and scheduled date.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-tippd-blue mt-0.5" />
          <div>
            <p className="font-medium text-sm">Delivery window</p>
            <p className="text-sm text-gray-500">
              You&apos;ll receive your 4-hour delivery window the evening before
              your scheduled date.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Link
          href="/"
          className="block w-full py-3 bg-tippd-blue text-white rounded-md font-semibold hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
