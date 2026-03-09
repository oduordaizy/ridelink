import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Contact Us | iTravas",
    description: "Reach out to the iTravas team for questions, feedback, or support.",
    alternates: {
        canonical: "/contact",
    },
    robots: {
        index: false,
        follow: true,
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
