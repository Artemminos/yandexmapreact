import React, {useState} from 'react';
import {YMaps, Map, Placemark, Clusterer, Polyline} from 'react-yandex-maps';
import startIcon from './images/start.svg';
import placeIcon from './images/place.svg';
import directionIcon from './images/direction.svg';
import finishIcon from './images/finish.svg';

export const App = () => {
    const startButtons = `
        <div id="control_buttons">
        <button control-type="start_point">Создать старт</button>
        </div>`;
    const workButtons = `
        <div id="control_buttons">
        <button control-type="new_point">Создать метку</button>
        <button control-type="direction_point">Создать точку направления</button>
        <button control-type="finish_point">Создать финиш</button>
        </div>`;
    const finishButtons = `
        <div id="control_buttons">
        </div>`;

    const mapState = {
        center: [54.97587993436103, 37.430915260066975],
        zoom: 10,
    };

    const [ymaps, setYmaps] = useState(null);//это ссылка на yandex-map API
    const [mapRef, setMapRef] = useState(null);//это сслыка на инстанс карты

    const [placeMarkList, setPlaceMarkList] = React.useState([]);
    const [polylineList, setPolylineList] = React.useState([]);
    const [createStatus, setCreateStatus] = React.useState(true);
    const [menuCount, setMenuCount] = React.useState(1)
    React.useEffect(() => {
        const coords = placeMarkList.map((elem) => elem.coords);
        setPolylineList(coords);
    }, [placeMarkList]);
    React.useEffect(() => {
        let coords;
        const newPlaceMarkHandler = (placeItem) => {
            setPlaceMarkList(prev => [...prev, placeItem]);
            closeContextMenuHandler()
        };
        const contextMenuHandler = function (e) {
            coords = e.get('coords');
            mapRef.balloon.open(coords, {
                contentHeader: 'Привет!',
                contentBody: (() => {
                    let type;
                    placeMarkList.forEach((elem) => {
                        if (elem.type === 'start_point') {
                            type = 'start_point'
                        }
                        if (elem.type === 'finish_point') {
                            type = 'finish_point'
                        }
                    })
                    if (type === 'start_point') {
                        return workButtons

                    }
                    if (type === 'finish_point') {
                        return finishButtons
                    }
                    return startButtons
                })(),
                contentFooter: 'FIT DEV'
            }).then(() => {
                const block = document.querySelector('#control_buttons');
                block.addEventListener('click', (e) => {
                    const controlType = e.target.attributes['control-type'].value
                    switch (controlType) {
                        case 'new_point':
                            newPlaceMarkHandler({
                                coords,
                                icon: placeIcon,
                                type: 'new_point',
                                id: String(Math.random()).slice(2)
                            });
                            break;
                        case 'direction_point':
                            newPlaceMarkHandler({
                                coords,
                                icon: directionIcon,
                                type: 'direction_point',
                                id: String(Math.random()).slice(2)

                            });
                            break;
                        case 'start_point':
                            newPlaceMarkHandler({
                                coords,
                                icon: startIcon,
                                type: 'start_point',
                                id: String(Math.random()).slice(2)

                            });
                            break;
                        case 'finish_point':
                            newPlaceMarkHandler({
                                coords,
                                icon: finishIcon,
                                type: 'finish_point',
                                id: String(Math.random()).slice(2)

                            });
                            break;
                        default:
                            break;
                    }
                });
            });
        }
        const closeContextMenuHandler = () => {
            mapRef.balloon.close()
            setMenuCount(menuCount + 1)
        }
        const clearListeners = () => {
            mapRef?.events?.remove('contextmenu', contextMenuHandler)
            mapRef?.events?.remove('click', closeContextMenuHandler)
        }
        mapRef?.events?.add('contextmenu', contextMenuHandler);
        mapRef?.events?.add('click', closeContextMenuHandler);
        mapRef?.controls.remove('geolocationControl');
        mapRef?.controls.remove('searchControl');
        mapRef?.controls.remove('fullscreenControl');
        return clearListeners
    }, [mapRef, menuCount]);
    React.useEffect(() => {
        if (!createStatus) {
            setPlaceMarkList(prev => {
                const copy = prev.map((elem) => {
                    if (elem.type === 'direction_point') {
                        elem.icon = ' '
                    }
                    return elem
                })
                return copy;
            })
        }
    }, [createStatus]);

    //todo приближение на правую кнопку убрать
    return (
        <>
            <button onClick={() => {
                setCreateStatus(false)
            }} style={{
                position: 'absolute',
                top: '0px',
                zIndex: 1,
                right: 0,
                width: '100px',
                height: '100px'
            }}>set ready
            </button>
            <YMaps
                query={{
                    load: 'package.full'
                }}
            >
                <Map
                    width={1500}
                    height={1000}
                    onLoad={ymaps => setYmaps(ymaps)}
                    defaultState={mapState}
                    instanceRef={ref => setMapRef(ref)}
                    modules={[
                        'templateLayoutFactory',
                        'clusterer.addon.balloon',
                    ]}
                >
                    <Clusterer
                        options={{
                            preset: 'islands#invertedVioletClusterIcons',
                            groupByCoordinates: false,
                            gridSize: 1
                        }}
                    >
                        {placeMarkList.length ? placeMarkList.map((item, index) => {
                            return (
                                <Placemark
                                    key={index}
                                    geometry={item.coords}
                                    modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                                    onDrag={e => {
                                        setPlaceMarkList(prev => {
                                            prev[index].coords = e._sourceEvent.originalEvent.target.geometry._coordinates

                                            return prev;
                                        });
                                        setPolylineList(prev => {
                                            const copy = [...prev]
                                            copy[index] = e._sourceEvent.originalEvent.target.geometry._coordinates
                                            return copy
                                        });
                                    }}
                                    options={{
                                        draggable: true,
                                        iconLayout: 'default#image',
                                        iconImageHref: item.icon,
                                        iconImageSize: [40, 52],
                                        iconImageOffset: [-5, -38],
                                    }}
                                    properties={{
                                        hintContent: 'Это хинт',
                                        balloonContent: (() => `<button balloon-id=${item.id} class="balloon_delete_button">Delete this!</button>`)()
                                    }}
                                    onClick={() => {
                                        setTimeout(() => {
                                            const balloonElem = document.querySelector('.balloon_delete_button');
                                            const balloonId = balloonElem.attributes['balloon-id'].value
                                            balloonElem.addEventListener('click', () => {
                                                setPlaceMarkList(prev => {
                                                    const copy = prev.filter((elem) => {
                                                        if (String(elem.id) === String(balloonId)){
                                                            if (elem.type === 'finish_point'){
                                                                setMenuCount(menuCount + 1)
                                                            }
                                                        }
                                                        return String(elem.id) !== String(balloonId)
                                                    });
                                                    return copy;
                                                });

                                            })
                                        }, 0)
                                    }}
                                />
                            )
                        }) : ''}
                    </Clusterer>
                    <Polyline
                        geometry={polylineList}
                        options={{
                            strokeColor: '#ff0000',
                            strokeWidth: 4,
                            strokeOpacity: 0.5,
                        }}
                    />
                </Map>

            </YMaps>
        </>
    );
};

export default App