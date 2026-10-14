import { ArrowRight, CheckCircle, Clock, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    icon: Package,
    title: 'Submit',
    description: 'List your waste materials with details and photos',
  },
  {
    icon: CheckCircle,
    title: 'Verify',
    description: 'We inspect and verify the material quality',
  },
  {
    icon: Clock,
    title: 'Purchase',
    description: 'Receive a fair offer and get paid',
  },
  {
    icon: Truck,
    title: 'Process',
    description: 'Materials are processed and recycled',
  },
  {
    icon: ArrowRight,
    title: 'Sell',
    description: 'Quality recycled materials are sold to industry',
  },
];

const howItWorks = [
  {
    title: 'For Sellers',
    description: 'Turn your waste into revenue with a simple process',
  },
  {
    title: 'For Buyers',
    description: 'Source verified, sustainable materials at scale',
  },
  {
    title: 'Circular Economy',
    description: 'Reduce waste and build a sustainable future',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-[#F5F7F5] py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Turn Waste Into Value
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Connect waste generators with industry buyers. We verify, purchase, and process waste materials into high-quality
              recycled resources.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-6">
              <Button size="lg" asChild>
                <Link to="/sell-material">
                  Sell Material to Company
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/marketplace">Browse Processed Materials</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
              <p className="mt-4 text-muted-foreground">Our end-to-end process from waste to value</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, index) => (
                <Card key={step.title} className="h-full border border-[#DDE6DE] bg-white shadow-sm">
                  <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Step {index + 1}
                      </p>
                      <h3 className="text-base font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7F5] py-16">
        <div className="container px-4">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-3">
              {howItWorks.map((item) => (
                <Card key={item.title} className="border border-[#DDE6DE] bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
