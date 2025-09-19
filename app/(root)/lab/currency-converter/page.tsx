import { CurrencyConverter } from "@/features/currency-converter/components/currency-converter";

export const revalidate = 60;

export default function Page() {
  return (
    <div className="flex w-full flex-col justify-center px-6 pb-24 pt-8">
      <section className="mx-auto max-w-screen-wrapper">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">
            Currency Converter
          </h1>
          <p className="text-muted-foreground">
            Real-time currency conversion with live exchange rates
          </p>
        </div>

        <CurrencyConverter apiKey={process.env.EXCHANGE_RATE_API_KEY} />
      </section>
    </div>
  );
}
