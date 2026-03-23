package in.yashsarvaiya.cloudshareapi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry){
       String uploadDir= Path.of("uploads").toAbsolutePath().toString();
       registry.addResourceHandler("/uploads/**")
               .addResourceLocations("file:"+uploadDir+"/");
    }
}
