import {
  Button,
  Card,
  Circle,
  H1,
  H2,
  Paragraph,
  ScrollView,
  Separator,
  Spacer,
  Text,
  XStack,
  YStack,
} from 'tamagui'

const Screen2 = () => {
  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" space="$4">
          {/* Header Section */}
          <YStack space="$2">
            <H1 color="$color12" fontWeight="bold">
              Welcome to Screen 2
            </H1>
            <Paragraph color="$color11" size="$4">
              This is a dummy screen built with Tamagui components
            </Paragraph>
          </YStack>

          <Separator />

          {/* Cards Section */}
          <YStack space="$3">
            <H2 color="$color12" size="$6">
              Feature Cards
            </H2>

            <XStack space="$3" flexWrap="wrap">
              <Card
                elevate
                size="$4"
                bordered
                animation="bouncy"
                scale={0.9}
                hoverStyle={{ scale: 0.925 }}
                pressStyle={{ scale: 0.875 }}
                flex={1}
                minWidth={200}
              >
                <Card.Header padded>
                  <H2 size="$4">Card 1</H2>
                  <Paragraph theme="alt2">This is a sample card with some content</Paragraph>
                </Card.Header>
                <Card.Footer padded>
                  <XStack>
                    <Button size="$3" variant="outlined">
                      Action
                    </Button>
                    <Spacer />
                    <Button size="$3" theme="alt2">
                      Learn More
                    </Button>
                  </XStack>
                </Card.Footer>
              </Card>

              <Card
                elevate
                size="$4"
                bordered
                animation="bouncy"
                scale={0.9}
                hoverStyle={{ scale: 0.925 }}
                pressStyle={{ scale: 0.875 }}
                flex={1}
                minWidth={200}
              >
                <Card.Header padded>
                  <H2 size="$4">Card 2</H2>
                  <Paragraph theme="alt2">Another card with different styling</Paragraph>
                </Card.Header>
                <Card.Footer padded>
                  <XStack>
                    <Button size="$3" variant="outlined">
                      Action
                    </Button>
                    <Spacer />
                    <Button size="$3" theme="alt2">
                      Learn More
                    </Button>
                  </XStack>
                </Card.Footer>
              </Card>
            </XStack>
          </YStack>

          {/* Interactive Section */}
          <YStack space="$3">
            <H2 color="$color12" size="$6">
              Interactive Elements
            </H2>

            <XStack space="$3" alignItems="center" flexWrap="wrap">
              <Button size="$4" theme="blue">
                Primary Button
              </Button>

              <Button size="$4" variant="outlined">
                Secondary Button
              </Button>

              <Button size="$4" theme="red" variant="outlined">
                Danger Button
              </Button>

              <Circle
                size={60}
                backgroundColor="$blue10"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontWeight="bold" size="$6">
                  A
                </Text>
              </Circle>
            </XStack>
          </YStack>

          {/* Content Section */}
          <YStack space="$3">
            <H2 color="$color12" size="$6">
              Content Area
            </H2>

            <YStack space="$2" padding="$3" backgroundColor="$color2" borderRadius="$4">
              <Text fontWeight="600" color="$color12">
                Sample Content Block
              </Text>
              <Paragraph color="$color11">
                This is a content area with some sample text. It demonstrates how Tamagui components
                can be used to create rich, interactive interfaces with consistent theming and
                styling.
              </Paragraph>
              <Paragraph color="$color10" size="$3">
                The components are fully customizable and support various themes, sizes, and
                variants.
              </Paragraph>
            </YStack>
          </YStack>

          {/* Additional Content for Scrolling */}
          <YStack space="$3">
            <H2 color="$color12" size="$6">
              More Content
            </H2>

            {Array.from({ length: 5 }, (_, i) => (
              <Card key={i} elevate size="$3" bordered>
                <Card.Header padded>
                  <H2 size="$3">Content Item {i + 1}</H2>
                  <Paragraph theme="alt2">
                    This is additional content to demonstrate scrolling functionality. Each card
                    represents a different section of content that can be scrolled through.
                  </Paragraph>
                </Card.Header>
              </Card>
            ))}
          </YStack>

          {/* Footer */}
          <YStack alignItems="center" space="$2" paddingTop="$4" paddingBottom="$6">
            <Separator />
            <Text color="$color10" size="$3">
              Built with Tamagui Components
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  )
}

export default Screen2
