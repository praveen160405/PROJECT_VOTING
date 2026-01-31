import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, ArrowRight, BarChart } from "lucide-react";

export default function DashboardPage() {
  const features = [
    {
      title: "Cast Your Vote",
      description: "Browse verified candidates and make your voice heard on the blockchain.",
      link: "/dashboard/vote",
      icon: Vote,
      cta: "Go to Voting Booth",
    },
    {
      title: "View Results",
      description: "See the live, transparent election results directly from the smart contract.",
      link: "/dashboard/results",
      icon: BarChart,
      cta: "See Live Results",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to the OOTU Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Your secure, transparent, and immutable voting platform.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Link href={feature.link} className="w-full">
                <Button className="w-full">
                  {feature.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
