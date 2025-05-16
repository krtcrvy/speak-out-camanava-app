import { Container } from '~/components/ui/container';
import { Content } from '~/components/ui/content';
import { ImageBackground } from '~/components/ui/image-background';

type AuthLayoutProps = {
  children: React.ReactNode;
  withBackground?: boolean;
};

export const AuthLayout = ({ children, withBackground }: AuthLayoutProps) => {
  return (
    <Container>
      {withBackground ? (
        <ImageBackground
          source={require('~/assets/illustration.png')}
          className="flex-1"
          contentPosition="bottom center"
          contentFit="contain">
          <Content className="items-start bg-background/95">{children}</Content>
        </ImageBackground>
      ) : (
        <Content className="items-start">{children}</Content>
      )}
    </Container>
  );
};
