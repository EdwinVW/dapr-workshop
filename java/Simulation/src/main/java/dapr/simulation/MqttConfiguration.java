package dapr.simulation;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.integration.annotation.IntegrationComponentScan;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.integration.dsl.IntegrationFlows;
import org.springframework.integration.dsl.Transformers;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.support.json.Jackson2JsonObjectMapper;
import org.springframework.messaging.MessageHandler;

import java.util.Map;

@Configuration
@IntegrationComponentScan
public class MqttConfiguration {
    @Bean
    public IntegrationFlow entryCamera(final Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder) {
        var mapper = jacksonObjectMapperBuilder.build();
        return IntegrationFlows.from("trafficcontrol/entrycam")
                .transform(Transformers.toJson(new Jackson2JsonObjectMapper(mapper)))
                .enrichHeaders(Map.of("mqtt_topic", "trafficcontrol/entrycam"))
                .handle(mqttOutbound())
                .get();
    }

    @Bean
    public IntegrationFlow exitCamera(final Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder) {
        var mapper = jacksonObjectMapperBuilder.build();
        return IntegrationFlows.from("trafficcontrol/exitcam")
                .transform(Transformers.toJson(new Jackson2JsonObjectMapper(mapper)))
                .enrichHeaders(Map.of("mqtt_topic", "trafficcontrol/exitcam"))
                .handle(mqttOutbound())
                .get();
    }

    @Bean
    public MessageHandler mqttOutbound() {
        var handler = new MqttPahoMessageHandler("tcp://localhost:1883", "simulation");
        handler.setAsync(true);
        return handler;
    }
}